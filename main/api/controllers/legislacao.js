var gdb = require("../utils/graphdb");

module.exports.legislacao = async function(){
    var myquery = `
    select ?data (group_concat(distinct ?c2;separator=";") as ?entidades) ?estado ?fonte ?id ?link ?numero ?sumario ?tipo where{
        ?id rdf:type :Legislacao;
     		:diplomaData ?data;
    		:diplomaEstado ?estado;
    		:diplomaLink ?link;
    		:diplomaNumero ?numero;
    		:diplomaSumario ?sumario;
    		:diplomaTipo ?tipo.
    optional{?id :temEntidadeResponsavel ?c2.}
    optional{?id :diplomaFonte ?fonte.} 
}GROUP BY ?data ?estado ?fonte ?id ?link ?numero ?sumario ?tipo
order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        var dado = {}
        if(C1.data != undefined) dado['data'] = C1.data.value;
        if(C1.entidades.value != "") 
            dado['entidades'] = await Promise.all(C1.entidades.value.split(';').map(C2 => {
            let d = getSiglaEntidade(C2.split('#')[1])
            return d.then()
        }));
        dado['id'] = C1.id.value.split('#')[1]
        if(C1.estado != undefined) dado['estado'] = C1.estado.value;
        if(C1.fonte != undefined) dado['fonte'] = C1.fonte.value;
        if(C1.link != undefined) dado['link'] = C1.link.value;
        if(C1.numero != undefined) dado['numero'] = C1.numero.value;
        if(C1.sumario != undefined) dado['sumario'] = C1.sumario.value;
        if(C1.tipo != undefined) dado['tipo'] = C1.tipo.value;
		return dado;
	}));
    return dados
}

module.exports.legislacaoId = async function(id){
    var myquery = `
    select ?data (group_concat(distinct ?c2;separator=";") as ?entidades) ?estado ?fonte ?link ?numero ?sumario ?tipo where{
        :${id} rdf:type :Legislacao;
            :diplomaData ?data;
    		:diplomaEstado ?estado;
    		:diplomaLink ?link;
    		:diplomaNumero ?numero;
    		:diplomaSumario ?sumario;
    		:diplomaTipo ?tipo.
    optional{:${id} :temEntidadeResponsavel ?c2.}
    optional{:${id} :diplomaFonte ?fonte.}   
}GROUP BY ?data ?estado ?fonte ?link ?numero ?sumario ?tipo
    `
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    var dado = {}
    if(C1.data != undefined) dado['data'] = C1.data.value;
    if(C1.entidades.value != "") 
        dado['entidades'] = await Promise.all(C1.entidades.value.split(';').map(C2 => {
        let d = getSiglaEntidade(C2.split('#')[1])
        return d.then()
    }));
    if(C1.estado != undefined) dado['estado'] = C1.estado.value;
    dado['id'] = id
    if(C1.fonte != undefined) dado['fonte'] = C1.fonte.value;
    if(C1.link != undefined) dado['link'] = C1.link.value;
    if(C1.numero != undefined) dado['numero'] = C1.numero.value;
    if(C1.sumario != undefined) dado['sumario'] = C1.sumario.value;
    if(C1.tipo != undefined) dado['tipo'] = C1.tipo.value;
    return dado;
}

async function getSiglaEntidade(id) {
    var myquery = `
    select ?sigla where{
        :${id} :entSigla ?sigla.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            id: id,
        }
    if(C1 != undefined) dados['sigla'] = C1.sigla.value
    return dados

}

module.exports.processos = async function(id){
    var myquery = `
    select ?codigo ?id ?titulo where{
        ?id :temLegislacao :${id};
            :codigo ?codigo;
            :titulo ?titulo.
    }order by asc(?id)
    `
    var result = await gdb.execQuery(myquery);
    let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        return {
            codigo: C1.codigo.value,
            id: C1.id.value.split('#')[1],
            titulo: C1.titulo.value
        }
	}));
    return dados
    

}

module.exports.numero = async function(num){
    var myquery = `
    select ?id where{
        ?id rdf:type :Legislacao;
            :diplomaNumero "${num}";
    }

    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}

module.exports.portarias = async function(){
    var myquery = `
    select ?estado ?id ?numero ?sumario  where{
        ?id rdf:type :Legislacao;
            :diplomaTipo "Portaria";
    		:diplomaEstado ?estado;
    		:diplomaNumero ?numero;
    		:diplomaSumario ?sumario.
    }
    order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(C1 => {
        return {
            estado: C1.estado.value,
            legislacao: C1.id.value,
            numero: C1.numero.value,
            sumario: C1.sumario.value
        };
    }));
    
    return dados

}

module.exports.insert = async function(body){
    var entidades = body.entidadesSel.map(E => {
        return `:temEntidadeResponsavel :${E.id};`
    })
    entidades = entidades.join('')
    var processos = body.processosSel.map(E => {
        return `:estaAssoc :c${E.codigo};`
    })
    processos = processos.join('')
    
    var myquery = `
    insert data {
        :leg_${body.sigla} rdf:type :Legislacao,
                                    owl:NamedIndividual;
                          ${entidades}
                          ${processos}
                          :diplomaTipo "${body.tipo}" ;
                          :diplomaEstado "${body.estado}" ;
                          :diplomaSumario "${body.internacional}" ;
                          :diplomaFonte "${body.diplomaFonte}" ;
                          :diplomaLink "${body.link}";
                          :diplomaNumero "${body.numero}";
                          :diplomaData "${body.data}";
                          :diplomaLink "${body.link}".
                          
                          
    }
    `
    var results = await gdb.execTransaction(myquery);
    return
}

module.exports.edit = async function(id,body){
    var entidades = body.entidadesSel.map(E => {
        return `:temEntidadeResponsavel :${E.id};`
    })
    entidades = entidades.join('')
    var processos = body.processosSel.map(E => {
        return `:estaAssoc :c${E.codigo};`
    })
    processos = processos.join('')
    var myquery = `
    delete {
        :${id} ?p ?o.
    }
    insert {
        :${id} rdf:type :Legislacao,
                                    owl:NamedIndividual;
                          ${entidades}
                          ${processos}
                          :diplomaTipo "${body.tipo}" ;
                          :diplomaEstado "${body.estado}" ;
                          :diplomaSumario "${body.sumario}" ;
                          :diplomaFonte "${body.diplomaFonte}" ;
                          :diplomaLink "${body.link}";
                          :diplomaNumero "${body.numero}";
                          :diplomaData "${body.data}";
                          :diplomaLink "${body.link}".
                          
    }
    where {
        :${id} ?p ?o.
    } 
    `
    var results = await gdb.execTransaction(myquery);
    return
}

module.exports.revogar = async function(id,body){
    var myquery = `
    delete {
        :${id} :diplomaEstado ?d.
    }
    insert {
        :${id} :diplomaEstado "Revogado" ;
               :diplomaDataRevogacao "${body.dataRevogacao}".
                          
    }
    where {
        :${id} :diplomaEstado ?d.
    } 
    `
    var results = await gdb.execTransaction(myquery);
    return
}
