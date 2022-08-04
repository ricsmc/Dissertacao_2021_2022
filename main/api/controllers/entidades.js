var gdb = require("../utils/graphdb");
const Entidades = module.exports;


Entidades.entidades = async function(completa,ents,sigla,designacao,internacional,sioe,estado,pn){
    var vars = {
        filters : "",
        groupBy : "",
        vars : "?id",
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
    select ${vars.vars} where{
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
            dado.dono =  await Entidades.intDono(dado.id);
            dado.participante =  await Entidades.intParticipante(dado.id);
            dado.tipologias = await Entidades.intParticipante(dado.id);
        }

        return dado
    }));
    
    return dados

}

Entidades.id = async function(completa,id){
    var vars = {
        groupBy : "",
        optionals : "",
    }
    var myquery = `
    select ?designacao ?estado ?internacional ?sigla ?sioe where{
        :${id} :entDesignacao ?designacao;
              :entEstado ?estado;
              :entInternacional ?internacional;
              :entSigla ?sigla;
              :entSIOE ?sioe.
        ${vars.optionals}
    }
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
            dados.dono =  await Entidades.intDono(id);
            dados.participante =  await Entidades.intParticipante(id);
            dados.tipologias = await Entidades.intParticipante(id);
        }
    
    return dados

}

Entidades.intDono = async function(id){
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

Entidades.intParticipante = async function(id){
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

Entidades.tipologias = async function(id){
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

Entidades.designacao = async function(designacao){
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

Entidades.sigla = async function(sigla){
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

Entidades.insert = async function(body){
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

Entidades.edit = async function(id,body){
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

Entidades.delete = async function(id){
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