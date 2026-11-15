"""Validate the site's JSON-LD against the official schema.org vocabulary.
Run from the tests folder:  python3 validate_structured_data.py
Downloads the vocabulary once (about 1.5 MB) into tests/.schemaorg.jsonld.
This checks types and properties offline; still run Google's Rich Results Test
on the live URL after launch (see docs/SEO.md)."""
import json, os, re, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
VOCAB = os.path.join(HERE, '.schemaorg.jsonld')
if not os.path.exists(VOCAB):
    urllib.request.urlretrieve('https://raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/29.3/schemaorg-current-https.jsonld', VOCAB)
vocab = json.load(open(VOCAB))['@graph']
types, props = {}, {}
for n in vocab:
    t = n.get('@type'); i = n.get('@id', '').replace('schema:', '')
    ts = t if isinstance(t, list) else [t]
    sub = n.get('rdfs:subClassOf'); sub = [s['@id'].replace('schema:', '') for s in (sub if isinstance(sub, list) else [sub] if sub else [])]
    if 'rdfs:Class' in ts or any(x and x.startswith('schema:') for x in ts if x != 'rdf:Property'):
        types[i] = sub
    if 'rdf:Property' in ts:
        d = n.get('schema:domainIncludes'); d = d if isinstance(d, list) else [d] if d else []
        props[i] = {x['@id'].replace('schema:', '') for x in d}
def ancestors(t, seen=None):
    seen = seen or set()
    if t in seen: return seen
    seen.add(t)
    for p in types.get(t, []): ancestors(p, seen)
    return seen
errors = []
def check(node, path):
    if isinstance(node, list):
        for i, x in enumerate(node): check(x, f'{path}[{i}]')
        return
    if not isinstance(node, dict): return
    t = node.get('@type')
    if t:
        if t not in types: errors.append(f'{path}: unknown type {t}')
        anc = ancestors(t)
        for k, v in node.items():
            if k.startswith('@'): continue
            if k not in props: errors.append(f'{path}.{k}: unknown property'); continue
            if props[k] and not (props[k] & anc): errors.append(f'{path}.{k}: not valid on {t}')
            check(v, f'{path}.{k}')
    else:
        for k, v in node.items(): check(v, f'{path}.{k}')
html = open(os.path.join(HERE, '..', 'index.html')).read()
ld = json.loads(re.search(r'<script type="application/ld\+json" id="ld-json">(.*?)</script>', html, re.S).group(1))
check(ld['@graph'], 'graph')
biz = [n for n in ld['@graph'] if n['@type'] == 'AutomotiveBusiness'][0]
biz['sameAs'] = ['https://instagram.com/x']; biz['openingHoursSpecification'] = [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday'], 'opens': '08:00', 'closes': '18:00'}]
check(biz, 'business+content.js')
print('\n'.join(errors) if errors else f'Structured data valid against schema.org vocabulary ({len(types)} types, {len(props)} properties checked)')
sys.exit(1 if errors else 0)
