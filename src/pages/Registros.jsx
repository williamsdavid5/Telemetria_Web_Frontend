import { useEffect, useState } from "react"
import MenuSuperior from "../components/MenuSuperior"
import '../styles/registros.css'
import api from "../server/api";

import ModalCarregandoDados from "../components/ModalCarregandoDados";
import MapaPercursoSelecionado from "../components/MapaPercursoSelecionado";
import loadingGif from '../assets/loadingGif.gif'

export default function Registros() {

    const [registros, setRegistros] = useState([]);
    const [carregando, setcarregando] = useState(false);
    const [carregandoRegistro, setcarregandoRegistro] = useState(false);

    // para a pesquisa entre os registros
    const [termoBusca, setTermoBusca] = useState('');
    const [dataInicio, setDataInicio] = useState({ dia: '', mes: '' });
    const [dataFim, setDataFim] = useState({ dia: '', mes: '' });

    const [dataInicioCompleta, setDataInicioCompleta] = useState('');
    const [dataFimCompleta, setDataFimCompleta] = useState('');

    // para a lógica de seleção de viagens na lista lateral
    const [viagemSelecionada, setViagemSelecionada] = useState(null);

    //para a lógica de carregamento aos poucos dos registros
    const [pagina, setPagina] = useState(1);
    const [temMais, setTemMais] = useState(true);
    const [carregandoLista, setCarregandoLista] = useState(false);


    // para a logica de pesquisar por periodo
    function dentroDoIntervalo(dataIso) {
        if (!dataInicio.dia || !dataInicio.mes || !dataFim.dia || !dataFim.mes) return true;

        const data = new Date(dataIso);
        const dia = data.getDate();
        const mes = data.getMonth() + 1;

        const dataAlerta = mes * 100 + dia;
        const dataInicioNum = parseInt(dataInicio.mes) * 100 + parseInt(dataInicio.dia);
        const dataFimNum = parseInt(dataFim.mes) * 100 + parseInt(dataFim.dia);

        return dataAlerta >= dataInicioNum && dataAlerta <= dataFimNum;
    }

    function dentroDoIntervaloCompleto(dataIso) {
        if (!dataInicioCompleta || !dataFimCompleta) return true;

        const data = new Date(dataIso);
        const dataAlerta = data.getTime(); // timestamp em milissegundos

        const [diaInicio, mesInicio, anoInicio] = dataInicioCompleta.split('/').map(Number);
        const [diaFim, mesFim, anoFim] = dataFimCompleta.split('/').map(Number);

        const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0);
        const dataFimObj = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59);

        return dataAlerta >= dataInicioObj.getTime() && dataAlerta <= dataFimObj.getTime();
    }

    async function buscarRegistrosCompleto(termo, dataInicio, dataFim) {
        const temTermo = termo.trim() !== '';
        const temDatas = dataInicio && dataFim;

        if (!temTermo && !temDatas) {
            setPagina(1);
            setRegistros([]);
            resgatarRegistros();
            return;
        }

        try {
            setCarregandoLista(true);

            const params = new URLSearchParams();
            if (temTermo) params.append('q', termo);

            if (temDatas) {
                // Converte dd/mm/aaaa para aaaa-mm-dd
                const [diaInicio, mesInicio, anoInicio] = dataInicio.split('/');
                const [diaFim, mesFim, anoFim] = dataFim.split('/');

                const inicioIso = `${anoInicio}-${mesInicio.padStart(2, '0')}-${diaInicio.padStart(2, '0')}`;
                const fimIso = `${anoFim}-${mesFim.padStart(2, '0')}-${diaFim.padStart(2, '0')}`;

                params.append('dataInicio', inicioIso);
                params.append('dataFim', fimIso);
            }

            const resposta = await api.get(`/viagens/buscar?${params.toString()}`);
            setRegistros(resposta.data);
            setTemMais(false);
        } catch (err) {
            console.error('Erro ao buscar registros:', err);
        } finally {
            setCarregandoLista(false);
        }
    }

    function validarData(data) {
        if (!data) return false;
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(data)) return false;

        const [dia, mes, ano] = data.split('/').map(Number);
        if (mes < 1 || mes > 12) return false;
        if (dia < 1 || dia > 31) return false;

        // Verificação básica de dias por mês
        const diasNoMes = new Date(ano, mes, 0).getDate();
        return dia <= diasNoMes;
    }

    async function resgatarRegistros() {
        try {
            setCarregandoLista(true);
            // setcarregando(true);
            const resposta = await api.get(`/viagens/limpo?page=${pagina}&limit=15`);
            const novos = resposta.data;

            const ordenados = novos.sort((a, b) => {
                const dataA = new Date(a.data_viagem);
                const dataB = new Date(b.data_viagem);
                if (dataA > dataB) return -1;
                if (dataA < dataB) return 1;
                return b.id - a.id;
            });

            setRegistros(prev => {
                const combinados = [...prev, ...ordenados];
                const unicos = combinados.filter(
                    (item, index, self) => index === self.findIndex(t => t.id === item.id)
                );
                return unicos;
            });


            if (ordenados.length < 15) {
                setTemMais(false);
            }

        } catch (err) {
            console.error('Erro ao resgatar registros:', err);
            alert('Erro ao resgatar registros');
        } finally {
            setCarregandoLista(false);
            // setcarregando(false);
        }
    }

    async function buscarRegistros(termo, dataInicio, dataFim) {
        const temTermo = termo.trim() !== '';
        const temDatas = dataInicio.dia && dataInicio.mes && dataFim.dia && dataFim.mes;

        if (!temTermo && !temDatas) {
            setPagina(1);
            setRegistros([]);
            resgatarRegistros();
            return;
        }

        try {
            setCarregandoLista(true);

            const params = new URLSearchParams();
            if (temTermo) params.append('q', termo);

            if (temDatas) {
                const anoAtual = new Date().getFullYear();
                const inicioIso = `${anoAtual}-${dataInicio.mes.padStart(2, '0')}-${dataInicio.dia.padStart(2, '0')}`;
                const fimIso = `${anoAtual}-${dataFim.mes.padStart(2, '0')}-${dataFim.dia.padStart(2, '0')}`;
                params.append('dataInicio', inicioIso);
                params.append('dataFim', fimIso);
            }

            const resposta = await api.get(`/viagens/buscar?${params.toString()}`);
            setRegistros(resposta.data);
            setTemMais(false);
        } catch (err) {
            console.error('Erro ao buscar registros:', err);
        } finally {
            setCarregandoLista(false);
        }
    }



    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    function gerarDataISO(data) {
        const dia = parseInt(data.dia);
        const mes = parseInt(data.mes);
        const ano = new Date().getFullYear();
        if (!dia || !mes || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
        return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }


    useEffect(() => {
        resgatarRegistros();
    }, [pagina])

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {

        return (
            <>
                <div className="registrosPage">
                    <div className="esquerdaRegistros">
                        <div className="topoRegistros">
                            <h2>Registros</h2>
                            <p>Procure entre registros, veículos, motoristas e datas, tudo acessível por aqui.</p>
                            <input
                                type="text"
                                placeholder="Pesquise qualquer coisa"
                                className="inputPesquisaQualquerCoisa"
                                value={termoBusca}
                                onChange={(e) => {
                                    const valor = e.target.value;
                                    setTermoBusca(valor);
                                    buscarRegistros(valor, dataInicio, dataFim);
                                }}
                            />



                            <p>Pesquisar por período:</p>
                            <div className="pesquisaPorData">
                                <div className="pesquisaPorDataInputs">
                                    <input
                                        type="text"
                                        placeholder="dd/mm/aaaa"
                                        className="inputdataCompleto"
                                        value={dataInicioCompleta}
                                        onChange={e => {
                                            const valor = e.target.value;

                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataInicioCompleta(valorFormatado);

                                            if (valorFormatado.length === 10 && validarData(valorFormatado) &&
                                                dataFimCompleta && validarData(dataFimCompleta)) {
                                                buscarRegistrosCompleto(termoBusca, valorFormatado, dataFimCompleta);
                                            }
                                        }}
                                        maxLength={10}
                                    />
                                    <span>até</span>
                                    <input
                                        type="text"
                                        placeholder="dd/mm/aaaa"
                                        className="inputdataCompleto"
                                        value={dataFimCompleta}
                                        onChange={e => {
                                            const valor = e.target.value;
                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataFimCompleta(valorFormatado);

                                            if (valorFormatado.length === 10 && validarData(valorFormatado) &&
                                                dataInicioCompleta && validarData(dataInicioCompleta)) {
                                                buscarRegistrosCompleto(termoBusca, dataInicioCompleta, valorFormatado);
                                            }
                                        }}
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="divRegistros">
                            {registros
                                .filter(registro => {
                                    const termo = termoBusca.toLowerCase();
                                    const corresponde = (
                                        registro.nome_motorista.toLowerCase().includes(termo) ||
                                        registro.identificador_veiculo.toLowerCase().includes(termo) ||
                                        registro.modelo_veiculo.toLowerCase().includes(termo) ||
                                        formatarDataHora(registro.data_viagem).includes(termo)
                                    );
                                    return corresponde && dentroDoIntervalo(registro.data_viagem);
                                })
                                .map(registro => (
                                    <div
                                        className={`registroItemLista ${viagemSelecionada && viagemSelecionada.id === registro.id ? 'selecionado' : ''
                                            }`}
                                        key={registro.id}
                                        onClick={() => {
                                            setViagemSelecionada(registro);
                                            setcarregandoRegistro(true);
                                        }}
                                    >
                                        <p><b>Início: </b>{formatarDataHora(registro.data_viagem)}</p>
                                        <p><b>Último registro: </b>{formatarDataHora(registro.ultimo_registro)}</p>
                                        <p><b>Motorista: </b>{registro.nome_motorista}</p>
                                        <p><b>Veículo usado: </b>{registro.identificador_veiculo}</p>
                                        <p><b>Modelo veículo: </b>{registro.modelo_veiculo}</p>
                                        <p><b>Alertas nessa viagem: </b>{registro.quantidade_alertas}</p>
                                    </div>
                                ))}

                            {/* 🔹 Rodapé com carregamento/paginação */}
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                                {carregandoLista && (
                                    <img
                                        src={loadingGif}
                                        alt="Carregando..."
                                        style={{ width: 40, marginTop: 10 }}
                                    />
                                )}

                                {!carregandoLista && temMais && (
                                    <button
                                        onClick={() => setPagina(p => p + 1)}
                                        className="botaoCarregarMais"
                                    >
                                        Carregar mais
                                    </button>
                                )}

                                {!temMais && registros.length > 0 && (
                                    <p style={{ color: '#888', marginTop: 10 }}>Todos os registros foram carregados ✅</p>
                                )}
                            </div>
                        </div>

                    </div>
                    <div className="direitaRegistros">
                        <MapaPercursoSelecionado viagemId={viagemSelecionada?.id} carregandoRegistros={carregandoRegistro} setCarregandoRegistros={setcarregandoRegistro} />
                        <div className="divAuxiliarSombra" style={{ width: '75%' }}></div>
                    </div>
                </div>
                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}