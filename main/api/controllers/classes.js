var gdb = require("../utils/graphdb");
const Classes = module.exports;


Classes.classes = async function(est,tipo,nivel,ents,tips,info){
    var x = {
        sel : '',
        v : '?id ?codigo ?titulo ?status ?class ?codigoPai ?tituloPai ?tipoProc ?procTrans',
        opt : '',
        g :'',
        dono :{
            codigo: '',
            titulo: '',
            id: '',
            status: '',
        },
        participante :{
            participLabel : '',
            sigla: '',
            designacao: '',
            idTipo: '',
            id: '',
            idParticipante: ''
        } 
    }
    var sel = `?id  :codigo ?codigo;
                   :titulo ?titulo;
                   :classeStatus ?status;
                   rdf:type ?class.
               filter(?class!=owl:NamedIndividual)
           optional{?id :classeStatus ?status.}
           optional{?id :temPai ?pai.
                       ?pai :codigo ?codigoPai;
                           :titulo ?tituloPai.}
           optional{?id :processoTipoVC ?tpoProc.
                   ?tpoProc skos:prefLabel ?tipoProc.
                   filter(lang(?tipoProc)='pt')}
           optional{?id :processoTransversal ?procTrans.}`

    if(!nivel && est!='lista' && !tipo && !((ents || tips) && info != 'pre-selecionados')) {
        x.sel = '(group_concat(distinct ?c2;separator=";") as ?filhos)  '
        x.opt = 'optional{?id :temFilho ?c2.}'
        x.g = `group by ${x.v}`
        sel = `?id ?p :Classe_N1 .
                ${sel}`
    }
    else if(nivel){
        sel = `?id ?p :Classe_N${nivel} .
                   ${sel}`
    } 
    else if(est==='lista'){
        sel = `{?id ?p :Classe_N1 .
                    ${sel}}
                union
                {?id ?p :Classe_N2 .
                    ${sel}}
                union
                {?id ?p :Classe_N3 .
                    ${sel}}
                union
                {?id ?p :Classe_N4 .
                    ${sel}}`
    }
    
    else if ((ents || tips) && info != 'pre-selecionados'){
        var ents_tips = null
        if(ents && tips)ents_tips = ents.split(',').concat(tips.split(','))
        else if(ents) ents_tips = ents.split(',')
        else ents_tips = tips.split(',')
        var tip = ''
        if(tipo) tip = `?id :processoTipoVC :vc_processoTipo_p${tipo.charAt(0)}.`
        sel = `?id ?p :Classe_N3 .
        ${sel}
        ${tip}`
        ents_tips.forEach((Element,i) => {
            sel = `${sel} ${i>0 ? 'union':'{'} {
                ?id :temDono :${Element}.
            }
            union{
                ?id :temParticipante :${Element}.
            }${i<ents_tips.length-1 ? '':'}'}`
        })

        x.g = `group by ${x.v}`
    }

    else if (tipo){
        sel = `?id ?p :Classe_N3.
                   ${sel}
               ?id :processoTipoVC :vc_processoTipo_p${tipo.charAt(0)}.`
    }

    var myquery = `
    select ${x.v} ${x.sel} where { 
        ${sel}
        ${x.opt}
    } ${x.g} order by ?id
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
        var dado = {
            codigo: C1.codigo.value,
            titulo: C1.titulo.value,
			id: C1.id.value,
			status: C1.status.value
		};
        if(C1.filhos) dado.filhos = C1.filhos.value.length> 0 ? await Promise.all(C1.filhos.value.split(';').map(async function (C2) {
            return await getClass(C2,2,info,ents,tips)
        })) : []
        if(info==='completa' || info==='esqueleto' || info==='pre-selecionados'){
            
            dado.pca = ''
            dado.df = ''
            let pca = await Classes.pca(dado.id.split('#')[1]);
            if (pca.length > 0) dado.pca = pca[0];
            else if(!Array.isArray(pca)) dado.pca = pca
            if (dado.pca && dado.pca.idJust) {
                dado.pca.justificacao = await Classes.justificacao(dado.pca.idJust);
            }
            let df = await Classes.classDF(dado.id.split('#')[1]);
            if (df.length > 0) dado.df = df[0];
            else if(!Array.isArray(df)) dado.df = df
            if (dado.df && dado.df.idJust) {
                dado.df.justificacao = await Classes.justificacao(dado.df.idJust);
            }
            if(info==='completa'){
                dado.pai = C1.codigoPai ? {
                    codigo:C1.codigoPai.value,
                    titulo:C1.tituloPai.value
                } : {}
                dado.tipoProc = C1.tipoProc ? C1.tipoProc.value : "",
                dado.procTrans = C1.procTrans ? C1.procTrans.value : ""
                dado.notasAp = await Classes.notasApEx(dado.id.split('#')[1],'Aplicacao');
                dado.exemplosNotasAp = await Classes.exemplosNotasAp(dado.id.split('#')[1]);
                dado.notasEx = await Classes.notasApEx(dado.id.split('#')[1],'Exclusao');
                dado.termosInd = await Classes.ti(dado.id.split('#')[1]);
                dado.donos = await Classes.classDono(dado.id.split('#')[1]);
                dado.participantes = await Classes.participante(dado.id.split('#')[1]);
                dado.processosRelacionados = await Classes.procRel(dado.id.split('#')[1]);
                dado.legislacao = await Classes.legislacao(dado.id.split('#')[1]);
            }
            if(info==='esqueleto'){
                dado.donos = [x.dono]
                dado.participantes = [x.participante]    
            }
            if(info==='pre-selecionados'){
                dado.donos = []
                dado.participantes = []
                if((nivel === 3 || C1.class.value.split('#')[1] == 'Classe_N3') && ents.length>0 && tips.length>0){
                    var donos = await Classes.classDono(dado.id.split('#')[1]);
                    var participantes = await Classes.participante(dado.id.split('#')[1]);
                    var e = ents ? ents.split(',') : []
                    var t = tips ? tips.split(',') : []
                    e.forEach(element => {
                        if(donos.some(e => e.idDono === element))
                            dado.donos.push('Sim')
                        else dado.donos.push('Nao')
                        if(participantes.some(e => e.idParticipante === element))
                            dado.participantes.push(participantes.find(e => e.idParticipante === element).participLabel)
                        else dado.participantes.push('Nao')
                    });
                    t.forEach(element => {
                        if(donos.some(e => e.idDono === element))
                            dado.donos.push('Sim')
                        else dado.donos.push('Nao')
                        if(participantes.some(e => e.idParticipante === element))
                            dado.participantes.push(participantes.find(e => e.idParticipante === element).participLabel)
                        else dado.participantes.push('Nao')
                    });
                }
                
            }
        }
		return dado
	}));
    return dados
}

async function getClass(elem,nivel,info,ents,tips) { 
    var e = elem.split('#')[1]
    var x = {
        sel : '',
        opt : '',
        g :'',
        v : '?codigo ?titulo ?status ?class ?codigoPai ?tituloPai ?tipoProc ?procTrans',
        dono :{
            codigo: '',
            titulo: '',
            id: '',
            status: '',
        },
        participante :{
            participLabel : '',
            sigla: '',
            designacao: '',
            idTipo: '',
            id: '',
            idParticipante: ''
        } 
    }
    var sel = `:${e} ?p :Classe_N${nivel} ;
                   :codigo ?codigo;
                   :titulo ?titulo;
                   :classeStatus ?status;
                   rdf:type ?class.
               filter(?class!=owl:NamedIndividual)
           optional{?id :classeStatus ?status.}
           optional{?id :temPai ?pai.
                       ?pai :codigo ?codigoPai;
                           :titulo ?tituloPai.}
           optional{?id :processoTipoVC ?tpoProc.
                   ?tpoProc skos:prefLabel ?tipoProc.
                   filter(lang(?tipoProc)='pt')}
           optional{?id :processoTransversal ?procTrans.}`
    if(nivel<4 && !((ents || tips) && info != 'pre-selecionados')) {
        x.sel = '(group_concat(distinct ?c2;separator=";") as ?filhos)'
        x.opt = `optional{:${e} :temFilho ?c2.}`
        x.g = `group by ${x.v}`
    }
    var myquery = `
    select ${x.v} ${x.sel} where { 
        ${sel}
        ${x.opt}
    } ${x.g}
    `
    var dados = null
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
        codigo: C1.codigo.value,
        titulo: C1.titulo.value,
        id: elem,
        status: C1.status.value
    };
    if(C1.filhos) dados.filhos = C1.filhos.value.length> 0 ? await Promise.all(C1.filhos.value.split(';').map(async function (C2) {
        return await getClass(C2,nivel+1,info,ents,tips)
    })) : []
    if(info==='completa' || info==='esqueleto' || info==='pre-selecionados'){

        dado.pca = ''
        dado.df = ''
        let pca = await Classes.pca(e);
        if (pca.length > 0) dados.pca = pca[0];
        else if(!Array.isArray(pca)) dados.pca = pca
        if (dados.pca && dados.pca.idJust) {
            dados.pca.justificacao = await Classes.justificacao(dados.pca.idJust);
        }
        let df = await Classes.classDF(e);
        if (df.length > 0) dados.df = df[0];
        else if(!Array.isArray(df)) dados.df = df
        if (dados.df && dados.df.idJust) {
            dados.df.justificacao = await Classes.justificacao(dados.df.idJust);
        }
        if(info==='completa'){
            dados.pai = C1.codigoPai ? {
                codigo:C1.codigoPai.value,
                titulo:C1.tituloPai.value
            } : {}
            dados.tipoProc = C1.tipoProc ? C1.tipoProc.value : "",
            dados.procTrans = C1.procTrans ? C1.procTrans.value : ""
            dados.notasAp = await Classes.notasApEx(e,'Aplicacao');
            dados.exemplosNotasAp = await Classes.exemplosNotasAp(e);
            dados.notasEx = await Classes.notasApEx(e,'Exclusao');
            dados.termosInd = await Classes.ti(e);
            dados.donos = await Classes.classDono(e);
            dados.participantes = await Classes.participante(e);
            dados.processosRelacionados = await Classes.procRel(e);
            dados.legislacao = await Classes.legislacao(e);
        }
        if(info==='esqueleto'){
            dados.donos = [x.dono]
            dados.participantes = [x.participante]    
        }
        if(info==='pre-selecionados' && ents.length>0 && tips.length>0){
            dados.donos = []
            dados.participantes = []
            if(nivel === 3){
                var donos = await Classes.classDono(e);
                var participantes = await Classes.participante(e);
                var e = ents ? ents.split(',') : []
                var t = tips ? tips.split(',') : []
                e.forEach(element => {
                    if(donos.some(e => e.idDono === element))
                        dados.donos.push('Sim')
                    else dados.donos.push('Nao')
                    if(participantes.some(e => e.idParticipante === element))
                        dados.participantes.push(participantes.find(e => e.idParticipante === element).participLabel)
                    else dados.participantes.push('Nao')
                });
                t.forEach(element => {
                    if(donos.some(e => e.idDono === element))
                        dados.donos.push('Sim')
                    else dados.donos.push('Nao')
                    if(participantes.some(e => e.idParticipante === element))
                        dados.participantes.push(participantes.find(e => e.idParticipante === element).participLabel)
                    else dados.participantes.push('Nao')
                });
            }
            
        }
    }
    

    return dados
    
}

Classes.class = async function(id,subarvore){
    var myquery = `
    select ?id ?class ?codigoPai ?tituloPai ?codigo ?titulo ?descricao ?status (group_concat(distinct ?c2;separator=";") as ?filhos) ?tipoProc ?procTrans where { 
        ?id :codigo ?codigo.
        :${id} :codigo ?codigo;
             :titulo ?titulo;
              :descricao ?descricao;
              rdf:type ?class.
        filter(?class!=owl:NamedIndividual)
    optional{:${id} :classeStatus ?status.}
    optional{:${id} :temFilho ?c2.}
    optional{:${id} :temPai ?pai.
             ?pai :codigo ?codigoPai;
                  :titulo ?tituloPai.}
    optional{:${id} :processoTipoVC ?tpoProc.
            ?tpoProc skos:prefLabel ?tipoProc.
            filter(lang(?tipoProc)='pt')}
    optional{:${id} :processoTransversal ?procTrans.}
    
    } group by ?id ?class ?codigo ?titulo ?status ?codigoPai ?tituloPai ?descricao ?tipoProc ?procTrans
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
        nivel : C1.class.value.slice(-1),
        pai : {
            codigo:C1.codigoPai.value,
            titulo:C1.tituloPai.value
        },
        codigo : C1.codigo.value,
        titulo : C1.titulo.value,
        descricao : C1.descricao.value,
        status : C1.status ? C1.status.value : "",
        temSubclasses4Nivel: false,
        temSubclasses4NivelPCA: false,
        temSubclasses4NivelDF: false,
        subdivisao4Nivel01Sintetiza02: true,
        tipoProc : C1.tipoProc ? C1.tipoProc.value : "",
        procTrans : C1.procTrans ? C1.procTrans.value : "",
        id : C1.id.value
    }

    dados.filhos = await Classes.classChildren(id);
    if (dados.filhos.length > 0) {
      if (dados.nivel == 3) dados.temSubclasses4Nivel = true;
    }
    dados.notasAp = await Classes.notasApEx(id,'Aplicacao');
    dados.exemplosNotasAp = await Classes.exemplosNotasAp(id);
    dados.notasEx = await Classes.notasApEx(id,'Exclusao');
    dados.termosInd = await Classes.ti(id);
    dados.donos = await Classes.classDono(id);
    dados.participantes = await Classes.participante(id);
    dados.processosRelacionados = await Classes.procRel(id);
    dados.legislacao = await Classes.legislacao(id);
    let pca = await Classes.pca(id);
    if (pca.length > 0) dados.pca = pca[0];
	if (dados.pca && dados.pca.idJust) {
        dados.pca.justificacao = await Classes.justificacao(dados.pca.idJust);
    }
    let df = await Classes.classDF(id);
    if (df.length > 0) dados.df = df[0];
    if (dados.df && dados.df.idJust) {
        dados.df.justificacao = await Classes.justificacao(dados.df.idJust);
    }
    let filhos = dados.filhos
    if(subarvore){
        filhos = await Promise.all(filhos.map(async function (Element) {
            return await Classes.class(Element.id.split('#')[1])
        } ))
        dados.filhos = filhos
    }
    return dados
}


Classes.classChildren = async function(id){
    var myquery = `
    select * where { 
        :${id} :temFilho ?c2.
        ?c2 :classeStatus ?status;
                :codigo ?codigo ;
                :titulo ?titulo .
    }order by asc(?c2)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings
    dados = await Promise.all (C1.map(C2 => {
        return {
            codigo: C2.codigo.value,
            titulo: C2.titulo.value,
            id: C2.c2.value,
            status: C2.status.value,
        }
    }
    )) 
	
    return dados
}



Classes.classDF = async function(id){
    var myquery = `
    select ?df ?idJust ?valor where { 
        :${id} :temDF ?df.
        ?df :temJustificacao ?idJust;
            :dfValor ?valor;
     }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    if(C1){
        dados = {
            idJust : C1.idJust.value.split('#')[1],
            valor : C1.valor.value,
            idDF : C1.df.value
        }
    }
    
	
    return dados
}

Classes.classDono = async function(id){
    var myquery = `
    select distinct ?id ?tipo ?sigla ?designacao where { 
        {:${id} :temDono ?id.
        ?id rdf:type ?tipo;
            :entSigla ?sigla;
            :entDesignacao ?designacao}
        union
        {:${id} :temDono ?id.
        ?id rdf:type ?tipo;
            :tipSigla ?sigla;
            :tipDesignacao ?designacao}
        filter( ?tipo != owl:NamedIndividual )
    
    }order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            tipo: C1.tipo.value,
            sigla: C1.sigla.value,
			idDono: C1.id.value.split('#')[1],
            idTipo: C1.tipo.value.split('#')[1],
			designacao: C1.designacao.value,
            id: C1.id.value
		};
	}));
	
    return dados
}

Classes.exemplosNotasAp = async function(id){
    var myquery = `
    select ?id ?exemplo where { 
        :${id} :temExemploNA ?id.
        ?id :conteudo ?exemplo.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idExemplo: C1.id.value,
            exemplo: C1.exemplo.value
		};
	}));
	
    return dados
}

Classes.legislacao = async function(id){
    var myquery = `
    select ?id ?tipo ?sumario ?numero where { 
        :${id} :temLegislacao ?id.
        ?id :diplomaTipo ?tipo;
            :diplomaSumario ?sumario;
            :diplomaNumero ?numero;
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            tipo: C1.tipo.value,
            sumario: C1.sumario.value,
            numero: C1.numero.value,
            idLeg: C1.id.value.split('#')[1],
            id: C1.id.value,
		};
	}));
	
    return dados
}

Classes.meta = async function(id){
    var myquery = `
    select ?codigo ?pai ?desc ?pt ?procTrans ?status ?titulo ?tituloPai ?codigoPai ?procTipo (lang(?procTipo) as ?lang) where { 
        :${id} :codigo ?codigo;
                     :temPai ?pai;
                     :descricao ?desc;
                     :processoTipoVC ?pt;
                     :processoTransversal ?procTrans;
                     :classeStatus ?status;
                     :titulo ?titulo.
        ?pai :titulo ?tituloPai;
             :codigo ?codigoPai.
        ?pt skos:prefLabel ?procTipo.      
    }
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
	dados = {
            codigo:C1.codigo.value,
            codigoPai:C1.codigoPai.value,
            desc:C1.desc.value,
            id:id,
            pai:C1.pai.value,
            procTrans:C1.procTrans.value,
            pt:C1.pt.value,
            status:C1.status.value,
            titulo:C1.titulo.value,
            tituloPai:C1.tituloPai.value
		}
    
    result.results.bindings.forEach(element => {
        var objName = 'procTipo_' + element.lang.value
        dados[objName] = element.procTipo.value
    });
	
    return dados
}

Classes.notasApEx = async function(id,ap_ex){
    var myquery = `
    select ?idNota ?nota where { 
        :${id} :temNota${ap_ex} ?idNota.
        ?idNota :conteudo ?nota.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idNota: C1.idNota.value,
            nota: C1.nota.value,
		};
	}));
	
    return dados
}

Classes.participante = async function(id){
    var myquery = `
    select ?participLabel ?sigla ?designacao ?id ?idTipo where{
        {:${id} :temParticipante ?id.
        ?id rdf:type ?idTipo;
            ?obj :${id};
            :entDesignacao ?designacao;
            :entSigla ?sigla.
        ?obj rdfs:subPropertyOf :participaEm;
             rdfs:label ?participLabel.
             filter(lang(?participLabel)='pt')}
        union
        {:${id} :temParticipante ?id.
        ?id rdf:type ?idTipo;
            ?obj :${id};
            :tipDesignacao ?designacao;
            :tipSigla ?sigla.
        ?obj rdfs:subPropertyOf :participaEm;
             rdfs:label ?participLabel.
             filter(lang(?participLabel)='pt')}
        filter( ?idTipo != owl:NamedIndividual && ?obj != :participaEm)
    }group by ?sigla ?designacao ?id ?idTipo ?participLabel order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            participLabel : C1.participLabel.value.split(' ')[2],
            sigla: C1.sigla.value,
            designacao: C1.designacao.value,
            idTipo: C1.idTipo.value.split('#')[1],
            id: C1.id.value,
            idParticipante: C1.id.value.split('#')[1]
		};
	}));
	
    return dados
}

Classes.pca = async function(id){
    var myquery = `
    select (group_concat(distinct ?lang;separator=";") as ?langs) (group_concat(distinct ?formaContagem;separator=";") as ?formaContagens) ?idPCA ?idJust ?notas ?valores where {
        select (lang(?formaContagem) as ?lang) ?formaContagem ?idPCA ?idJust ?notas ?valores where{
        :${id} :temPCA ?idPCA.
        ?idPCA :temJustificacao ?idJust;
               :pcaValor ?valores.
        optional{?idPCA :pcaNota ?notas.}
        ?idPCA :pcaFormaContagemNormalizada ?fc.
        ?fc skos:prefLabel ?formaContagem.  
    }
    } group by ?idPCA ?idJust ?notas ?valores
    `
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    var dados = []
    if(C1){
        var notas = ''
        if(C1.notas !== undefined){
            notas = C1.notas.value
        }
        dados = {
            ['formaContagem_' + C1.langs.value.split(';')[0]] : C1.formaContagens.value.split(';')[0],
            ['formaContagem_' + C1.langs.value.split(';')[1]] : C1.formaContagens.value.split(';')[1],
            idPCA : C1.idPCA.value,
            idJust : C1.idJust.value.split('#')[1],
            notas: notas,
            valores : C1.valores.value
        }
	
    }
    
    return dados
}

Classes.procRel = async function(id,relacao){
    relacao = relacao || 'temRelProc'
    var myquery = `
    select ?id ?codigo ?rel ?titulo ?status where{
        :${id} :${relacao} ?id;
                     ?rel ?id.
        ?id :codigo ?codigo;
            :titulo ?titulo;
            :classeStatus ?status.
        filter(?rel != :temRelProc)
    } order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            codigo: C1.codigo.value,
            tipoRel: C1.rel.value,
            idRel: C1.rel.value.split('#')[1],
            titulo: C1.titulo.value,
            id: C1.id.value,
            status: C1.status.value
		};
	}));
	
    return dados
}

Classes.ti = async function(id){
    var myquery = `
    select ?idTI ?termo where{
        :${id} :temTI ?idTI.
        ?idTI :termo ?termo.
    } order by asc(?idTI)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idTI: C1.idTI.value,
            termo: C1.termo.value,
		};
	}));
	
    return dados
}

Classes.codigo = async function(id){
    var myquery = `
    select ?pred ?subj where{
        :${id} ?pred ?subj.
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;
}

Classes.justificacao = async function(id){
    var myquery = `
    select ?tipoId ?conteudo ?criterio (group_concat(distinct ?p;separator=";") as ?processos) (group_concat(distinct ?l;separator=";") as ?legislacao) where{
        {
           :${id} :temCriterio ?criterio.
       ?criterio :conteudo ?conteudo;
                 rdf:type ?tipoId;
       optional{?criterio :critTemLegAssoc ?l;}}
       union
       {
           :${id} :temCriterio ?criterio.
       ?criterio :conteudo ?conteudo;
                 rdf:type ?tipoId;
       optional{?criterio :critTemProcRel ?p;}}
       filter(?tipoId != owl:NamedIndividual && ?tipoId != :CriterioJustificacao && ?tipoId != :AtributoComposto)
   } group by ?tipoId ?conteudo ?criterio
    `
    var dados = []
    var l = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
        var legislacao = C1.legislacao.value
        var processos = C1.processos.value
        if(legislacao != '') legislacao = legislacao.split(';').map(l => {
            return {
                ledId : l.split('#')[1]
            }
        });
        else legislacao = []
        if(processos != '') processos = processos.split(';').map(p => {
            return {
                ledId : p.split('#')[1]
            }
        });
        else processos = []
		return {
            tipoId: C1.tipoId.value.split('#')[1],
            conteudo: C1.conteudo.value,
            criterio: C1.criterio.value,
            processos: processos,
            legislacao: legislacao
		};
	}));
	
    return dados
}

Classes.titulo = async function(title){
    var myquery = `
    select ?id ?title where{
        {?id rdf:type :Classe_N1;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N2;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N3;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N4;
            :titulo "${title}".}
        
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;
}

