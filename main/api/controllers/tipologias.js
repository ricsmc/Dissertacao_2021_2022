var gdb = require("../utils/graphdb");

module.exports.tipologias = async function(completa,tips,designacao,estado){
    var vars = {
        filters : "",
        groupBy : "",
        vars : "?id ?sigla",
        completa : "",
        optionals : "",
        designacao : "?designacao",
        estado : "?estado",
    }
    
    if(tips) {
        vars.filters = "filter("
        tips.split(',').forEach((Tipologia,i,arr) => {
            if(i > 0) vars.filters = `${vars.filters}||`
            vars.filters = `${vars.filters}?id=:${Tipologia}`
            if(i == arr.length-1) vars.filters = `${vars.filters})`
        })
    }


    if(designacao) vars.designacao = `"${designacao}"`
    else vars.vars = `${vars.vars} ${vars.designacao}`

    if(estado) vars.estado = `"${estado}"`
    else vars.vars = `${vars.vars} ${vars.estado}`

    if(completa){
        vars.groupBy = `group by ${vars.vars}`
        vars.completa = '(group_concat(distinct ?d;separator=";") as ?dono) (group_concat(distinct ?p;separator=";") as ?participante) (group_concat(distinct ?e;separator=";") as ?entidades)'
        vars.optionals = `optional{?id :eDonoProcesso ?d.} 
        optional{?id :participaEm ?p.}    
        optional{?id :contemEntidade ?e.}  `
    }
    
    var myquery = `
    select ${vars.vars} ${vars.completa} where{
        ?id rdf:type :TipologiaEntidade;
            :tipDesignacao ?designacao;
            :tipEstado ?estado;
            :tipSigla ?sigla.
        ${vars.optionals}
        ${vars.filters}
    }${vars.groupBy} order by asc(?id)
    `
    console.log(myquery)
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        var dado = {
            id: C1.id.value.split('#')[1],
            sigla: C1.sigla.value
        }

        if(designacao) dado.designacao = designacao
        else dado.designacao = C1.designacao.value

        if(estado) dado.estado = estado
        else dado.estado = C1.estado.value

        if(completa) {
            dado.dono = C1.dono.value.length > 0 ? await Promise.all(C1.dono.value.split(';').map(Element => getDono(Element))) : []
            dado.participante = C1.participante.value.length > 0 ? await Promise.all(C1.participante.value.split(';').map(Element => getParticipante(Element,C1.id.value.split('#')[1]))) : []
            dado.entidades = C1.entidades.value.length > 0 ? await Promise.all(C1.entidades.value.split(';').map(Element => getEntidades(Element))) : []
        }
        return dado
	}));
    return dados
}

async function getParticipante(elem,id) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?codigo ?titulo ?tipoPar where { 
        :${e} :codigo ?codigo;
            :titulo ?titulo;
            ?tipoPar :${id}.
        filter(?tipoPar != owl:NamedIndividual && ?tipoPar != :temParticipante && ?tipoPar != :temDono)
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            codigo: C1.codigo.value,
            id:e,
            tipoPar:C1.tipoPar.value.split('#')[1],
            titulo: C1.titulo.value,
        }    
    
    return dados
    
}

async function getEntidades(elem) {
    
    var e = elem.split('#')[1]
    var myquery =  `
    select ?designacao ?sigla where { 
        :${e} :entDesignacao ?designacao;
            :entSigla ?sigla.
    }
    `

    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    if (C1==undefined) dados =  {id:e}
    else {
        dados = {
            designacao: C1.designacao.value,
            id:e,
            sigla: C1.sigla.value,
        }    
    }
    return dados
    
}

async function getDono(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?codigo ?titulo where { 
        :${e} :codigo ?codigo;
            :titulo ?titulo.
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            codigo: C1.codigo.value,
            id:e,
            titulo: C1.titulo.value,
        }    
    
    return dados
    
}

module.exports.tipologia = async function(completa,id){
    var vars = {
        groupBy : "",
        completa : "",
        optionals : "",
    }

    if(completa){
        vars.groupBy = `group by ?designacao ?estado ?sigla`
        vars.completa = '(group_concat(distinct ?d;separator=";") as ?dono) (group_concat(distinct ?p;separator=";") as ?participante) (group_concat(distinct ?e;separator=";") as ?entidades)'
        vars.optionals = `optional{:${id} :eDonoProcesso ?d.} 
        optional{:${id} :participaEm ?p.}    
        optional{:${id} :contemEntidade ?e.}  `
    }

    var myquery = `
    select ?designacao ?estado ?sigla ${vars.completa} where{
        :${id} :tipDesignacao ?designacao;
            :tipEstado ?estado;
            :tipSigla ?sigla.
        ${vars.optionals}
    }${vars.groupBy}
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    console.log(C1)
    dados =  {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            sigla: C1.sigla.value
    }
    if(completa) {
        dados.dono = C1.dono.value.length > 0 ? await Promise.all(C1.dono.value.split(';').map(Element => getDono(Element))) : []
        dados.participante = C1.participante.value.length > 0 ? await Promise.all(C1.participante.value.split(';').map(Element => getParticipante(Element,id))) : []
        dados.entidades = C1.entidades.value.length > 0 ? await Promise.all(C1.entidades.value.split(';').map(Element => getEntidades(Element))) : []
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