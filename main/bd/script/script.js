'use strict';

const rdf = require('rdf');
const { NamedNode, BlankNode, Literal } = rdf;
const N3 = require('n3');
const store = new N3.Store();
const fact = require('rdf-data-factory')
const factory = new fact.DataFactory();
var fs = require('fs');
const rdfParser = require("rdf-parse").default;
var config = require('../clav-triples.json');

/**
 * (@en) File parse to triple stream imported by graph              
 * (@pt) Parse do ficheiro para stream de triplos importada para o grafo
 * @param {RDFJS stream} quadStream - Stream de triplos
 */

 const quadStream = rdfParser.parse(fs.createReadStream('../clave.ttl'),
 { contentType: 'text/turtle' });

store.import(quadStream)
 .on('end', () => console.log('Stream has been imported'));
 
console.log(quadStream)

var final = []

/**
 * (@en) All named individuals identification
 * (@pt) Identificação dos named individuals
 */
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


/**
 * (@en) Triple translation and migration to graph
 * (@pt) Tradução e migração dos triplos
 */
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

/**
 * (@en) Write in file
 * (@pt) Escrita no ficheiro
 */
const quad = store.match()
quad
  .pipe(new N3.StreamWriter())
  .pipe(fs.createWriteStream('data.ttl'));
