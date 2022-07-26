#!/usr/bin/env python
# coding: utf-8

# In[60]:

import json
import rdflib
from rdflib import Graph, Literal, RDF, URIRef, BNode
import json
from rdflib.namespace import CSVW, DC, DCAT, DCTERMS, DOAP, FOAF, ODRL2, ORG, OWL,                            PROF, PROV, RDF, RDFS, SDO, SH, SKOS, SOSA, SSN, TIME,                            VOID, XMLNS, XSD
import os

# In[1]:


print("Em que formato deseja o output? (ttl - 1 , json-triples - 2 , json - 3)")
str = input()

f = open("../clav-triples.json")
data = json.load(f)

final = []




for element in data["triples"]:
    if len(element["object"]["value"].split('#')) > 1 :
        if element["object"]["value"].split('#')[1] == "NamedIndividual":
            if element["subject"]["value"].split('#')[1].split('_')[0] != "vc":
                final.append(element["subject"]["value"])

g = Graph()
g.parse("../clave.ttl")
# In[61]:

if int(str)== 1:
    

    # In[63]:


    for element in data["triples"]:
        if element["subject"]["value"] in final:
            subject =  element["subject"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            predicate =  element["predicate"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            if element["object"]["type"] == 'literal':
                g.add((
                    rdflib.URIRef(subject),
                    rdflib.URIRef(predicate),
                    Literal(element["object"]["value"])
                ))
            else :
                object = element["object"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav') 
                g.add((
                    rdflib.URIRef(subject),
                    rdflib.URIRef(predicate),
                    rdflib.URIRef(object)
                ))
            


    # In[64]:


    pr = g.serialize(format="turtle")
    g.serialize(destination='output.ttl',format="turtle")

if int(str) == 2 :
    dado={
        "triples":[]
    }
    for s, p, o in g:
        if type(o) == rdflib.term.Literal:
            dados = {
                "subject":{
                    "value":s,
                    "type":"uri"
                },
                "predicate":{
                    "value":p,
                    "type":"uri"
                },
                "object":{
                    "value":o,
                    "type":"literal"
                },
            }
            if o.language != None:
                dados['object']['lang'] = o.language
        else:
            dados = {
                "subject":{
                    "value":s,
                    "type":"uri"
                },
                "predicate":{
                    "value":p,
                    "type":"uri"
                },
                "object":{
                    "value":o,
                    "type":"uri"
                },
            }
        dado["triples"].append(dados)
        if not (s, p, o) in g:
            raise Exception("Iterator / Container Protocols are Broken!!")

    for element in data["triples"]:
        if element["subject"]["value"] in final:
            subject =  element["subject"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            predicate =  element["predicate"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            if element["object"]["type"] == 'literal':
                dados = {
                    "subject":{
                        "value":subject,
                        "type":"uri"
                    },
                    "predicate":{
                        "value":predicate,
                        "type":"uri"
                    },
                    "object":{
                        "value":element["object"]["value"],
                        "type":"literal"
                    },
                }
                dado["triples"].append(dados)
            else :
                object = element["object"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav') 
                dados = {
                    "subject":{
                        "value":subject,
                        "type":"uri"
                    },
                    "predicate":{
                        "value":predicate,
                        "type":"uri"
                    },
                    "object":{
                        "value":object,
                        "type":"uri"
                    },
                }
                dado["triples"].append(dados)
                
    json_object = json.dumps(dado, indent = 2)

    with open('output.json', 'w') as output:
        output.write(json_object)

if int(str) == 3 :
    dado={
    }
    for s, p, o in g:
        subject = s.n3().translate({ord(i): None for i in '<>'})
        predicate = p.n3().translate({ord(i): None for i in '<>'})
        if subject not in dado:
            dado[subject]={}
        if p not in dado[subject]:
            dado[subject][predicate]=[]
        if type(o) == rdflib.term.Literal:
            ob = {
                "value":o.toPython(),
                'type':'literal'
            }
            if o.datatype != None:
                ob['datatype'] = o.datatype
            if o.language != None:
                ob['lang'] = o.language
        else: 
            object = o.n3().translate({ord(i): None for i in '<>'})
            ob = {
                "value":object,
                'type':'uri'
            }
        dado[subject][predicate].append(ob)
            
        if not (s, p, o) in g:
            raise Exception("Iterator / Container Protocols are Broken!!")

    for element in data["triples"]:
        if element["subject"]["value"] in final:
            subject =  element["subject"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            predicate =  element["predicate"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
            if subject not in dado:
                dado[subject]={}
            if predicate not in dado[subject]:
                dado[subject][predicate]=[]
            o = {
                    "value":element["object"]["value"]
                }
            if element["object"]["type"] == 'literal':
                o['type']='literal'
                if 'datatype' in element["object"]:
                    o['datatype'] = element["object"]["datatype"]
            else: 
                o['value'] = element["object"]["value"].replace('jcr.di.uminho.pt/m51-clav','di.uminho.pt/clav')
                o['type']='uri'
            dado[subject][predicate].append(o)
                
    json_object = json.dumps(dado, indent = 2)

    with open('output.json', 'w') as output:
        output.write(json_object)
