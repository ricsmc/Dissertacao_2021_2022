'use strict';

const rdf = require('rdf');
const { NamedNode, BlankNode, Literal } = rdf;
const N3 = require('n3');
const store = new N3.Store();
const fact = require('rdf-data-factory')
const factory = new fact.DataFactory();



var fs = require('fs');

var file = fs.readFileSync('../clave.ttl');
const rdfParser = require("rdf-parse").default;
const quadStream = rdfParser.parse(fs.createReadStream('../clave.ttl'),
  { contentType: 'text/turtle' });

store.import(quadStream)
  .on('end', () => console.log('Stream has been imported'));
var final = []

var config = require('../clav-triples.json');

config.triples.forEach(element => {
    if(element.object.value.split('#')[1] == "NamedIndividual"){
        if(element.subject.value.split('#')[1].split('_')[0] != "vc"){
            final.push(element.subject.value)
        }
            
    }
}); 
var nparse = ''
var subject = ''
var predicate = ''
var object = ''

config.triples.forEach(element => {
    if(final.includes(element.subject.value)){
        subject =  element.subject.value.replace('m51-clav','clav')
        predicate =  element.predicate.value.replace('m51-clav','clav')
        if(element.object.type == 'literal'){
            object = '"' + element.object.value.replace(/\"/g, '\\"') + '"'
            store.addQuad(factory.quad(
                factory.namedNode(subject),
                factory.namedNode(predicate),
                factory.literal(element.object.value)
              ));
        } 
        else {
            object = element.object.value.replace('m51-clav','clav') 
            store.addQuad(factory.quad(
                factory.namedNode(subject),
                factory.namedNode(predicate),
                factory.namedNode(object)
              ));
        }
         
        
    }
});
const quad = store.match()
quad
  .pipe(new N3.StreamWriter())
  .pipe(fs.createWriteStream('data.ttl'));
