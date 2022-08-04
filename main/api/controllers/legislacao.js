var gdb = require("../utils/graphdb");
const Legislacao = module.exports;


Legislacao.legislacao = async function(completa,fonte,estado,pn){
    var vars = {
        groupBy : "",
        vars : '?data ?id ?link ?numero ?sumario ?tipo',
        fonte : "?fonte",
        estado : "?estado",
        pn:""
    }

    if(fonte) vars.fonte = `"${fonte}"`
    else vars.vars = `${vars.vars} ${vars.fonte}`

    if(estado) vars.estado = `"${estado}"`
    else vars.vars = `${vars.vars} ${vars.estado}`

    if(pn=="com") vars.pn = `filter exists {?id :estaAssoc ?pn.}`
    else if (pn=="sem") vars.pn = `filter not exists {?id :estaAssoc ?pn.}`
    vars.groupBy = `group by ${vars.vars}`
    
    var myquery = `
    select ${vars.vars} (group_concat(distinct ?c2;separator=";") as ?entidades) where{
        ?id rdf:type :Legislacao;
     		:diplomaData ?data;
    		:diplomaEstado ?estado;
    		:diplomaLink ?link;
    		:diplomaNumero ?numero;
    		:diplomaSumario ?sumario;
    		:diplomaTipo ?tipo.
        ${vars.pn}
        optional{?id :temEntidadeResponsavel ?c2.}
        optional{?id :diplomaFonte ?fonte.} 
    }${vars.groupBy}
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
        else dado.entidades = []
        dado['id'] = C1.id.value.split('#')[1]
        if(fonte) dado.fonte = fonte
        else if(C1.fonte != undefined) dado.fonte = C1.fonte.value

        if(estado) dado.estado = estado
        else dado.estado = C1.estado.value
        
        if(C1.link != undefined) dado['link'] = C1.link.value;
        if(C1.numero != undefined) dado['numero'] = C1.numero.value;
        if(C1.sumario != undefined) dado['sumario'] = C1.sumario.value;
        if(C1.tipo != undefined) dado['tipo'] = C1.tipo.value;

        if(completa) {
            dado.regula = await Legislacao.processos(dado.id)
        }
		return dado;
	}));
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

Legislacao.legislacaoId = async function(completa,id){
    var vars = {
        completa : "",
        optionals : "",
    }

    if(completa){
        vars.completa = '(group_concat(distinct ?r;separator=";") as ?regula)'
        vars.optionals = `optional{:${id} :estaAssoc ?r.}`
    }
    var myquery = `
    select ?data (group_concat(distinct ?c2;separator=";") as ?entidades) ?estado ?fonte ?link ?numero ?sumario ?tipo ${vars.completa} where{
        :${id} rdf:type :Legislacao;
            :diplomaData ?data;
    		:diplomaEstado ?estado;
    		:diplomaLink ?link;
    		:diplomaNumero ?numero;
    		:diplomaSumario ?sumario;
    		:diplomaTipo ?tipo.
        optional{:${id} :temEntidadeResponsavel ?c2.}
        optional{:${id} :diplomaFonte ?fonte.}
        ${vars.optionals}   
    }group by ?data ?estado ?fonte ?link ?numero ?sumario ?tipo
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
    if(completa) {
        dado.regula = C1.regula.value.length > 0 ? await Promise.all(C1.regula.value.split(';').map(Element => getDono(Element))) : []
    }
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

Legislacao.processos = async function(id){
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

Legislacao.numero = async function(num){
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

Legislacao.portarias = async function(){
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

Legislacao.insert = async function(body){
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
        :leg_${body.numero.replace('/','_')} rdf:type :Legislacao,
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

Legislacao.edit = async function(id,body){
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

Legislacao.revogar = async function(id,body){
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
