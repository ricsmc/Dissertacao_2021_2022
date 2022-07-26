var gdb = require("../utils/graphdb");

module.exports.notas = async function(){
    var myquery = `
    select ?cProc ?idNota ?nota ?tituloProc where{
        ?idNota rdf:type :NotaAplicacao;
                :conteudo ?nota;
                :naPertenceClasse ?cProc.
        ?cProc :titulo ?tituloProc.
    }order by asc(?idNota)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            cProc: C1.cProc.value.split("#")[1],
            idNota: C1.idNota.value.split("#")[1],
			nota: C1.nota.value,
			tituloProc: C1.tituloProc.value
		};
	}));
    return dados
}

module.exports.nota = async function(nota){
    var myquery = `
    select ?idNota where{
        ?idNota rdf:type :NotaAplicacao;
                :conteudo "${nota}".
    }order by asc(?idNota)
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}