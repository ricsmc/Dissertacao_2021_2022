var gdb = require("../utils/graphdb");

module.exports.entidades = async function(){
    var myquery = `
    select ?designacao ?estado ?id ?internacional ?sigla ?sioe where{
        ?id rdf:type :Entidade;
            :entDesignacao ?designacao;
            :entEstado ?estado;
            :entInternacional ?internacional;
            :entSigla ?sigla;
            :entSIOE ?sioe.
    } order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    dados = await Promise.all(result.results.bindings.map(C1 => {
        return {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            id: C1.id.value.split('#')[1],
            internacional: C1.internacional.value,
            sigla: C1.sigla.value,
            sioe: C1.sioe.value
        };
    }));
    
    return dados

}

module.exports.id = async function(id){
    var myquery = `
    select ?designacao ?estado ?internacional ?sigla ?sioe where{
        :${id} :entDesignacao ?designacao;
              :entEstado ?estado;
              :entInternacional ?internacional;
              :entSigla ?sigla;
              :entSIOE ?sioe.
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
    var tip = ';:pertenceTipologiaEnt '
    if(body.tipologiasSel.length === 1){
        tip = tip + `:${body.tipologiasSel[0].id}.`
    }
    else if(body.tipologiasSel.length > 1){
        body.tipologiasSel.forEach((element,index) => {
            if(index === body.tipologiasSel.length-1) tip = tip + `:${element.id}.`;
            else tip = tip + `:${element.id}, `;
        });
    }
    else tip = '.';
    
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
