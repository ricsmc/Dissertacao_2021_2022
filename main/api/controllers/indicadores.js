var gdb = require("../utils/graphdb");
const Indicadores = module.exports


Indicadores.classes = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        {?s rdf:type :Classe_N1.}
        union
        {?s rdf:type :Classe_N2.}
        union
        {?s rdf:type :Classe_N3.}
        union
        {?s rdf:type :Classe_N4.}
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de Classes",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.classesN1 = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Classe_N1.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de Classes de nível 1",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.classesN2 = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Classe_N2.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de Classes de nível 2",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.classesN3 = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Classe_N3.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de Classes de nível 3",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.classesN4 = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Classe_N4.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de Classes de nível 4",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.critJust = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :CriterioJustificacao.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de critério de justificação",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.critJustType = async function(critJust){
    const critJust2 = critJust.charAt(0).toUpperCase() + critJust.slice(1);
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :CriterioJustificacao${critJust2}.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número Total de critério de justificação " + critJust2,
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.critstats = async function(){
    var v = ["legal", "gestionario", "utilidadeAdministrativa", "densidadeInfo", "complementaridadeInfo"]

    var dados = []
    var dado = await getNumCritJust('',false)
    dados.push(dado)
    var aux = []    
    aux = await Promise.all(v.map(Element =>  getNumCritJust(Element,true)))
    dados.push.apply(dados,aux)
    return dados

}

async function getNumCritJust (critJust, i) {
    var critJust2 = critJust
    if(i){
        critJust2 = critJust.charAt(0).toUpperCase() + critJust.slice(1);
    }
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :CriterioJustificacao${critJust2}.
        }
    
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "CriterioJustificacao" + critJust2,
            valor:C1.count.value
        }
    return dados

}

Indicadores.df = async function(df){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?i :temDF ?s .
        ?s :dfValor "${df}".
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número de PNs com destino final igual a " + df,
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.dfstats = async function(){
    var v = ["C","CP","E","NE"]

    var dados = []
    dados = await Promise.all(v.map(Element =>  getNumDF(Element)))
    return dados

}

async function getNumDF (df) {
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?i :temDF ?s .
        ?s :dfValor "${df}".
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: df,
            valor:C1.count.value
        }
    return dados

}

Indicadores.entidades = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Entidade.
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número de Entidades",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.entidadesAtivas = async function(){
    var v = ["Ativa","Inativa","Harmonização"]

    var dados = []
    dados = await Promise.all(v.map(Element =>  getNumEntidades(Element)))
    return dados

}

async function getNumEntidades (estado) {
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        {?s rdf:type :Entidade;
            :entEstado "${estado}".
        }
        
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: estado,
            valor:C1.count.value
        }
    return dados

}

Indicadores.leg = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :Legislacao.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número de Diplomas Legislativos",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.legVigor = async function(){
    var v = ["Ativo","Revogado"]

    var dados = []
    dados = await Promise.all(v.map(Element =>  getNumLeg(Element)))
    return dados

}

async function getNumLeg (estado) {
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        {?s rdf:type :Legislacao;
            :diplomaEstado "${estado}".
        }
        
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: estado,
            valor:C1.count.value
        }
    return dados

}

Indicadores.relacoes = async function(r){
    var rel = r
    if(r=="dono") rel = "eDonoProcesso"
    else if(r=="participante") rel= "participaEm"
    else if (r=="temLeg") rel="temLegislacao"
    var myquery = `
    select (count(?s) as ?count) where{
        ?s :${rel} ?l.    
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número de relações " + r,
            valor:C1.count.value
        }
    return dados

}

Indicadores.relstats = async function(){
    var v = ["temRelProc","eAntecessorDe", "eSucessorDe","eComplementarDe","eCruzadoCom","eSinteseDe","eSintetizadoPor","eSuplementoDe","eSuplementoPara","temDono","temParticipante","temParticipanteApreciador","temParticipanteComunicador","temParticipanteDecisor","temParticipanteAssessor","temParticipanteIniciador","temParticipanteExecutor"]

    var dados = []
    dados = await Promise.all(v.map(Element =>  getNumRel(Element)))
    return dados

}

async function getNumRel(r) {
    var myquery = `
    select (count(?l) as ?count) where{
        ?s rdf:type :Classe_N3 .
        ?l rdf:type ?x.
        ?s :${r} ?l.   
        filter(?x=:Classe_N3||?x=:Entidade||?x=:Legislacao) 
        }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: r,
            valor:C1.count.value
        }

    return dados

}

Indicadores.tipologias = async function(){
    var myquery = `
    select (count(distinct ?s) as ?count) where{
        ?s rdf:type :TipologiaEntidade.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados =  {
            indicador: "Número de Tipologias",
            valor:C1.count.value
        }
    
    return dados

}

Indicadores.tabela = async function(){
    var dados = []
    dados.push(await Indicadores.classesN1())
    dados.push(await Indicadores.classesN2())
    dados.push(await Indicadores.classesN3())
    dados.push(await Indicadores.classesN4())
    dados.push.apply(dados,await Indicadores.relstats())
    dados.push.apply(dados,await Indicadores.critstats())
    dados.push.apply(dados,await Indicadores.dfstats())
    dados.push(await Indicadores.entidades())
    dados.push.apply(dados,await Indicadores.entidadesAtivas())
    dados.push(await Indicadores.leg())
    dados.push.apply(dados,await Indicadores.legVigor())
    dados.push(await Indicadores.tipologias())
    return dados

}