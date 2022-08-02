var gdb = require("../utils/graphdb");

module.exports.entidades = async function(completa,ents,sigla,designacao,internacional,sioe,estado,pn){
    var vars = {
        filters : "",
        groupBy : "",
        vars : "?id",
        completa : "",
        optionals : "",
        sigla : "?sigla",
        designacao : "?designacao",
        internacional : "?internacional",
        sioe : "?sioe",
        estado : "?estado",
        pn:""
    }
    
    if(ents) {
        vars.filters = "filter("
        ents.split(',').forEach((Entidade,i,arr) => {
            if(i > 0) vars.filters = `${vars.filters}||`
            vars.filters = `${vars.filters}?id=:${Entidade}`
            if(i == arr.length-1) vars.filters = `${vars.filters})`
        })
    }

    if(sigla) vars.sigla = `"${sigla}"`
    else vars.vars = `${vars.vars} ${vars.sigla}`

    if(designacao) vars.designacao = `"${designacao}"`
    else vars.vars = `${vars.vars} ${vars.designacao}`

    if(internacional) vars.internacional = `"${internacional}"`
    else vars.vars = `${vars.vars} ${vars.internacional}`

    if(sioe) vars.sioe = `"${sioe}"`
    else vars.vars = `${vars.vars} ${vars.sioe}`

    if(estado) vars.estado = `"${estado}"`
    else vars.vars = `${vars.vars} ${vars.estado}`

    if(completa){
        vars.groupBy = `group by ${vars.vars}`
        vars.completa = '(group_concat(distinct ?d;separator=";") as ?dono) (group_concat(distinct ?p;separator=";") as ?participante) (group_concat(distinct ?t;separator=";") as ?tipologias)'
        vars.optionals = `optional{?id :eDonoProcesso ?d.} 
        optional{?id :participaEm ?p.}    
        optional{?id :pertenceTipologiaEnt ?t.}  `
    }

    if(pn=="com") vars.pn = `{filter exists {?id :eDonoProcesso ?pn.}
    filter exists {?id :participaEm ?pn.}}
    union
    {filter not exists {?id :eDonoProcesso ?pn.}
    filter exists {?id :participaEm ?pn.}}
    union
    {filter exists {?id :eDonoProcesso ?pn.}
    filter not exists {?id :participaEm ?pn.}}
    `
    else if (pn=="sem") vars.pn = `{filter not exists {?id :eDonoProcesso ?pn.}
    filter not exists {?id :participaEm ?pn.}}`
    
    var myquery = `
    select ${vars.vars} ${vars.completa} where{
        ?id rdf:type :Entidade;
            :entDesignacao ${vars.designacao};
            :entEstado ${vars.estado};
            :entInternacional ${vars.internacional};
            :entSigla ${vars.sigla};
            :entSIOE ${vars.sioe}.
        ${vars.optionals}
        ${vars.filters}
        ${vars.pn}
    } ${vars.groupBy} order by asc(?id)
    `

    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(async function (C1) {
        var dado = {
            id: C1.id.value.split('#')[1],
        }
        if(sigla) dado.sigla = sigla
        else dado.sigla = C1.sigla.value

        if(designacao) dado.designacao = designacao
        else dado.designacao = C1.designacao.value

        if(internacional) dado.internacional = internacional
        else dado.internacional = C1.internacional.value

        if(sioe) dado.sioe = sioe
        else dado.sioe = C1.sioe.value

        if(estado) dado.estado = estado
        else dado.estado = C1.estado.value

        if(completa) {
            dado.dono = C1.dono.value.length > 0 ? await Promise.all(C1.dono.value.split(';').map(Element => getDono(Element))) : []
            dado.participante = C1.participante.value.length > 0 ? await Promise.all(C1.participante.value.split(';').map(Element => getParticipante(Element,C1.id.value.split('#')[1]))) : []
            dado.tipologias = C1.tipologias.value.length > 0 ? await Promise.all(C1.tipologias.value.split(';').map(Element => getTipologias(Element))) : []
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

async function getTipologias(elem) {
    
    var e = elem.split('#')[1]
    var myquery =  `
    select ?designacao ?sigla where { 
        :${e} :tipDesignacao ?designacao;
            :tipSigla ?sigla.
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


module.exports.id = async function(completa,id){
    var vars = {
        groupBy : "",
        completa : "",
        optionals : "",
    }

    if(completa){
        vars.groupBy = `group by ?designacao ?estado ?internacional ?sigla ?sioe`
        vars.completa = '(group_concat(distinct ?d;separator=";") as ?dono) (group_concat(distinct ?p;separator=";") as ?participante) (group_concat(distinct ?t;separator=";") as ?tipologias)'
        vars.optionals = `optional{:${id} :eDonoProcesso ?d.} 
        optional{:${id} :participaEm ?p.}    
        optional{:${id} :pertenceTipologiaEnt ?t.}  `
    }
    var myquery = `
    select ?designacao ?estado ?internacional ?sigla ?sioe ${vars.completa} where{
        :${id} :entDesignacao ?designacao;
              :entEstado ?estado;
              :entInternacional ?internacional;
              :entSigla ?sigla;
              :entSIOE ?sioe.
        ${vars.optionals}
    }${vars.groupBy}
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            id: id,
            internacional: C1.internacional.value,
            sigla: C1.sigla.value,
            sioe: C1.sioe.value
        }
    if(completa) {
        dados.dono = C1.dono.value.length > 0 ? await Promise.all(C1.dono.value.split(';').map(Element => getDono(Element))) : []
        dados.participante = C1.participante.value.length > 0 ? await Promise.all(C1.participante.value.split(';').map(Element => getParticipante(Element,id))) : []
        dados.tipologias = C1.tipologias.value.length > 0 ? await Promise.all(C1.tipologias.value.split(';').map(Element => getTipologias(Element))) : []
    }
    
    return dados

}

module.exports.intDono = async function(id){
    var myquery = `
    select ?id ?codigo ?titulo where{
        :${id} :eDonoProcesso ?id.
    	?id :codigo ?codigo;
         	:titulo ?titulo.
    }order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(C1 => {
        return {
            codigo: C1.codigo.value,
            id: C1.id.value.split('#')[1],
            titulo: C1.titulo.value
        };
    }));
    
    return dados

}

module.exports.intParticipante = async function(id){
    var myquery = `
    select ?id ?codigo ?titulo ?tipoPar where{
        :${id} :participaEm ?id.
    	?id ?tipoPar :${id};
        	:codigo ?codigo;
         	:titulo ?titulo.
        filter(?tipoPar != owl:NamedIndividual && ?tipoPar != :temParticipante)
    }order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(C1 => {
        return {
            codigo: C1.codigo.value,
            id: C1.id.value.split('#')[1],
            tipoPar : C1.tipoPar.value.split('#')[1],
            titulo: C1.titulo.value
        };
    }));
    
    return dados

}

module.exports.tipologias = async function(id){
    var myquery = `
    select ?id ?sigla ?designacao where{
        :ent_CMADL :pertenceTipologiaEnt ?id.
    	?id :tipDesignacao ?designacao;
         	:tipSigla ?sigla.
    }order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(C1 => {
        return {
            designacao: C1.designacao.value,
            id: C1.id.value.split('#')[1],
            sigla : C1.sigla.value
        };
    }));
    
    return dados

}

module.exports.designacao = async function(designacao){
    var myquery = `
    select ?id where{
    	?id rdf:type :Entidade;
    		:entDesignacao "${designacao}".
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;

}

module.exports.sigla = async function(sigla){
    var myquery = `
    select ?id where{
    	?id rdf:type :Entidade;
    		:entSigla "${sigla}".
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;

}

module.exports.insert = async function(body){
    var tip = listaTriplos(body.tipologiasSel,'pertenceTipologiaEnt ')
    
    var myquery = `
    insert data {
        :ent_${body.sigla} rdf:type :Entidade,
                                    owl:NamedIndividual;
                          :entDesignacao "${body.designacao}" ;
                          :entEstado "${body.estado}" ;
                          :entInternacional "${body.internacional}" ;
                          :entSIOE "${body.sioe}" ;
                          :entSigla "${body.sigla}"${tip}
                          
    }
    `
    var results = await gdb.execTransaction(myquery);
    return
}

module.exports.edit = async function(id,body){
    var tip = listaTriplos(body.tipologiasSel,'pertenceTipologiaEnt ')
    
    var myquery = `
    delete {
        :${id} rdf:type :Entidade,
                          owl:NamedIndividual;
                 :entDesignacao ?d ;
                :entEstado ?e ;
                :entInternacional ?i ;
                :entSIOE ?s ;
                :entSigla ?a ;
                :pertenceTipologiaEnt ?t.
    }
    insert {
        :${id} rdf:type :Entidade,
                                    owl:NamedIndividual;
                          :entDesignacao "${body.designacao}" ;
                          :entEstado "${body.estado}" ;
                          :entInternacional "${body.internacional}" ;
                          :entSIOE "${body.sioe}" ;
                          :entSigla "${body.sigla}"${tip}
                          
    }
    where {
        :${id} :entDesignacao ?d ;
                :entEstado ?e ;
                :entInternacional ?i ;
                :entSIOE ?s ;
                :entSigla ?a ;
                :pertenceTipologiaEnt ?t.
    } 
    `
    var results = await gdb.execTransaction(myquery);
    return
}

module.exports.delete = async function(id){
    var myquery = `
    delete {
        :${id} rdf:type :Entidade,
                          owl:NamedIndividual;
                 :entDesignacao ?d ;
                :entEstado ?e ;
                :entInternacional ?i ;
                :entSIOE ?s ;
                :entSigla ?a ;
                :pertenceTipologiaEnt ?t.
    } where {
        :${id} :entDesignacao ?d ;
                :entEstado ?e ;
                :entInternacional ?i ;
                :entSIOE ?s ;
                :entSigla ?a ;
                :pertenceTipologiaEnt ?t.
    } 
    `
    var results = await gdb.execTransaction(myquery);
    return { message : 'Removed'}
}


function listaTriplos(x,pred){
    var tip = ';:' + pred
    if(x.length === 1){
        tip = tip + `:${x[0].id}.`
    }
    else if(x.length > 1){
        x.forEach((element,index) => {
            if(index === x.length-1) tip = tip + `:${element.id}.`;
            else tip = tip + `:${element.id}, `;
        });
    }
    else tip = '.';

    return tip
}