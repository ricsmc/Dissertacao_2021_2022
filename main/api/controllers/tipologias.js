var gdb = require("../utils/graphdb");
const Tipologias = module.exports;


Tipologias.tipologias = async function(completa,tips,designacao,estado){

    var vars = {
        filters : "",
        vars : "?id ?sigla",
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
    
    var myquery = `
    select ${vars.vars} where{
        ?id rdf:type :TipologiaEntidade;
            :tipDesignacao ?designacao;
            :tipEstado ?estado;
            :tipSigla ?sigla.
        ${vars.filters}
    }order by asc(?id)
    `
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
            dado.dono =  await Tipologias.dono(dado.id);
            dado.participante =  await Tipologias.participante(dado.id);
            dado.entidades = await Tipologias.elementos(dado.id);
        }
        return dado
	}));
    return dados
}


Tipologias.tipologia = async function(completa,id){

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
    console.log(C1)
    dados =  {
            designacao: C1.designacao.value,
            estado: C1.estado.value,
            sigla: C1.sigla.value
    }
    if(completa) {
        dados.dono =  await Tipologias.dono(id);
        dados.participante =  await Tipologias.participante(id);
        dados.entidades = await Tipologias.elementos(id);
    }
    
    return dados

}

Tipologias.elementos = async function(id){
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

Tipologias.dono = async function(id){
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

Tipologias.participante = async function(id){
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

Tipologias.designacao = async function(designacao){
    var myquery = `
    select ?id where{
        ?id :tipDesignacao "${designacao}".
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}

Tipologias.sigla = async function(sigla){
    var myquery = `
    select ?id where{
        ?id :tipSigla "${sigla}".
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length >= 1) return true;
    else return false
}

Tipologias.insert = async function(body){
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

Tipologias.edit = async function(id,body){
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