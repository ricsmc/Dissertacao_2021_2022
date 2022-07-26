var gdb = require("../utils/graphdb");

module.exports.tipologias = async function(){
    var myquery = `
    select ?designacao ?estado ?id ?sigla where{
        ?id rdf:type :TipologiaEntidade;
            :tipDesignacao ?designacao;
            :tipEstado ?estado;
            :tipSigla ?sigla.
    }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            id: C1.id.value.split("#")[1],
            sigla: C1.sigla.value
		};
	}));
    return dados
}

module.exports.tipologia = async function(id){
    var myquery = `
    select ?designacao ?estado ?sigla where{
        :${id} :tipDesignacao ?designacao;
            :tipEstado ?estado;
            :tipSigla ?sigla.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            sigla: C1.sigla.value
        }
    
    return dados

}

module.exports.elementos = async function(id){
    var myquery = `
    select ?designacao ?id ?sigla where{
        :${id} :contemEntidade ?id.
        ?id :entDesignacao ?designacao;
            :entSigla ?sigla.
    }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            designacao: C1.designacao.value,
            id: C1.id.value.split("#")[1],
            sigla: C1.sigla.value
		};
	}));
    return dados
}

module.exports.dono = async function(id){
    var myquery = `
    select ?codigo ?id ?titulo where{
        :${id} :eDonoProcesso ?id.
        ?id :codigo ?codigo;
            :titulo ?titulo.
        }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            codigo: C1.codigo.value,
            id: C1.id.value.split("#")[1],
            titulo: C1.titulo.value
		};
	}));
    return dados
}

module.exports.participante = async function(id){
    var myquery = `
    select ?codigo ?id ?tipPar ?titulo where{
        :${id} rdf:type :TipologiaEntidade;
            :participaEm ?id.
        ?id :codigo ?codigo;
            ?tipPar :${id};
            :titulo ?titulo.
            filter(?tipPar != :temDono && ?tipPar != :temParticipante)
    }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            codigo: C1.codigo.value,
            id: C1.id.value.split("#")[1],
            tipPar: C1.tipPar.value.split("#")[1],
            titulo: C1.titulo.value
		};
	}));
    return dados
}

module.exports.designacao = async function(designacao){
    var myquery = `
    select ?id where{
        ?id :tipDesignacao "${designacao}".
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}

module.exports.sigla = async function(sigla){
    var myquery = `
    select ?id where{
        ?id :tipSigla "${sigla}".
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}

module.exports.insert = async function(body){
    var entidades = body.entidadesSel.map(E => {
        return `:contemEntidade :${E.id};`
    })
    entidades = entidades.join('')
    
    var myquery = `
    insert data {
        :tip_${body.sigla} rdf:type :TipologiaEntidade,
                                    owl:NamedIndividual;
                          ${entidades}
                          :tipDesignacao "${body.designacao}";
                          :tipEstado "${body.estado}";
                          :tipSigla "${body.sigla}".
                          
                          
    }
    `
    var results = await gdb.execTransaction(myquery);
    return
}

module.exports.edit = async function(id,body){
    var entidades = body.entidadesSel.map(E => {
        return `:contemEntidade :${E.id};`
    })
    entidades = entidades.join('')
    
    var myquery = `
    delete {
        :${id} ?p ?o.
    }
    insert {
        :tip_${body.sigla} rdf:type :TipologiaEntidade,
                                    owl:NamedIndividual;
                          ${entidades}
                          :tipDesignacao "${body.designacao}";
                          :tipEstado "${body.estado}";
                          :tipSigla "${body.sigla}".
                          
                          
    }
    where {
        :${id} ?p ?o.
    }
    `
    var results = await gdb.execTransaction(myquery);
    return
}