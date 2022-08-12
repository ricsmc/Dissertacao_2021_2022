var gdb = require("../utils/graphdb");
const TermosInd = module.exports;


TermosInd.termos = async function(){
    var myquery = `
    select ?codigoClasse ?estado ?id ?idClasse ?termo ?tituloClasse where{
        ?id rdf:type :TermoIndice;
            :estado ?estado;
            :termo ?termo;
            :estaAssocClasse ?codigoClasse.
           ?codigoClasse :codigo ?idClasse;
                      :titulo ?tituloClasse.
    }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            codigoClasse: C1.codigoClasse.value.split("#")[1],
            estado: C1.estado.value,
            id: C1.id.value.split("#")[1],
            idClasse: C1.idClasse.value,
			termo: C1.termo.value,
			tituloClasse: C1.tituloClasse.value
		};
	}));
    return dados
}

TermosInd.quantos = async function(nota){
    console.log(nota)
    var myquery = `
    select (count(distinct ?id) as ?count) where{
        ?id rdf:type :TermoIndice.
    }
    `
    var result = await gdb.execQuery(myquery);
    
    return parseInt(result.results.bindings[0].count.value)
}

TermosInd.termo = async function(termo){
    var myquery = `
    ask{
        ?id rdf:type :TermoIndice;
            :termo "${termo}".
    }
    `
    var result = await gdb.execQuery(myquery);
    return result.boolean;
}