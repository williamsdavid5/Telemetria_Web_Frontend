import '../styles/alertas.css'
import '../styles/registros.css'
import { useEffect, useState } from "react";
import api from "../server/api";

import MenuSuperior from "../components/MenuSuperior"
import ModalCarregandoDados from '../components/ModalCarregandoDados';
import Registros from './Registros';

import MapaAlertas from '../components/MapaAlertas';

//tela responsável
export default function Alertas() {

    // para a pesquisa entre os registros
    const [termoBusca, setTermoBusca] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // para a lógica de seleção de viagens na lista lateral
    const [viagemSelecionada, setViagemSelecionada] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [alertas, setAlertas] = useState([]);

    const [mostrarTodos, setMostrarTodos] = useState(false);

    async function carregarAlertas() {
        try {
            let resposta = await api.get('/alertas/limpo');
            setAlertas(resposta.data);
            setCarregando(false);
        } catch (err) {
            console.log(err);
            alert('Erro ao carregar alertas!');
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarAlertas();
    }, [])

    // para a logica de pesquisar por periodo
    function dentroDoIntervalo(dataIso) {
        if (!dataInicio || !dataFim) return true;

        const data = new Date(dataIso);
        const dataAlerta = data.getTime();

        const [diaInicio, mesInicio, anoInicio] = dataInicio.split('/').map(Number);
        const [diaFim, mesFim, anoFim] = dataFim.split('/').map(Number);

        const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0);
        const dataFimObj = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59);

        return dataAlerta >= dataInicioObj.getTime() && dataAlerta <= dataFimObj.getTime();
    }

    //vaila a data digitada pelo usuário
    function validarData(data) {
        if (!data) return false;
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(data)) return false;

        const [dia, mes, ano] = data.split('/').map(Number);
        if (mes < 1 || mes > 12) return false;
        if (dia < 1 || dia > 31) return false;

        const diasNoMes = new Date(ano, mes, 0).getDate();
        return dia <= diasNoMes;
    }

    //para formar a data da forma como vem do BD
    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }

    if (carregando) {
        return (
            <ModalCarregandoDados></ModalCarregandoDados>
        )
    } else {
        return (
            <>
                <div className="alertasPage">
                    <div className="esquerdaAlertas">
                        <div className="topoEsquerdaAlertasPage">
                            <h2>Alertas</h2>
                            <p>Busque entre todos os alertas do sistema</p>
                            <input
                                type="text"
                                placeholder="Pesquise qualquer coisa"
                                className="inputPesquisaQualquerCoisa"
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value)}
                            />

                            <p>Pesquisar por período:</p>
                            <div className="pesquisaPorData">
                                <div className="pesquisaPorDataInputs">
                                    <input
                                        type="text"
                                        placeholder="dd/mm/aaaa"
                                        className="inputdataCompleto"
                                        value={dataInicio}
                                        onChange={e => {
                                            const valor = e.target.value;
                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataInicio(valorFormatado);
                                        }}
                                        maxLength={10}
                                    />
                                    <span>até</span>
                                    <input
                                        type="text"
                                        placeholder="dd/mm/aaaa"
                                        className="inputdataCompleto"
                                        value={dataFim}
                                        onChange={e => {
                                            const valor = e.target.value;
                                            let valorFormatado = valor.replace(/\D/g, '');
                                            if (valorFormatado.length > 2) {
                                                valorFormatado = valorFormatado.substring(0, 2) + '/' + valorFormatado.substring(2);
                                            }
                                            if (valorFormatado.length > 5) {
                                                valorFormatado = valorFormatado.substring(0, 5) + '/' + valorFormatado.substring(5, 9);
                                            }
                                            setDataFim(valorFormatado);
                                        }}
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="divMostrarTodosAlertas">
                                <label htmlFor="">Mostrar todos os alertas no mapa</label>
                                <input type="checkbox" name="mostrarTodos" id="mostrarTodos" onChange={e => setMostrarTodos(e.target.checked)} />
                            </div>
                        </div>
                        <div className='divRegistros'>
                            {alertas
                                .filter(alerta => {
                                    const termo = termoBusca.toLocaleLowerCase();
                                    const corresponde = (
                                        alerta.nome_motorista.toLowerCase().includes(termo) ||
                                        alerta.veiculo_identificador.toLowerCase().includes(termo) ||
                                        alerta.veiculo_modelo.toLowerCase().includes(termo) ||
                                        formatarDataHora(alerta.data_hora).includes(termo)
                                    );
                                    return corresponde && dentroDoIntervalo(alerta.data_hora);
                                })
                                .map(alerta => {
                                    return (
                                        <div
                                            className={`registroItemLista ${viagemSelecionada === alerta.alerta_id ? 'selecionado' : ''}`}
                                            key={alerta.alerta_id}
                                            onClick={() => setViagemSelecionada(alerta.alerta_id)}
                                        >
                                            <p>{formatarDataHora(alerta.data_hora)}</p>
                                            <p><b>Motorista envolvido: </b>{alerta.nome_motorista}</p>
                                            <p><b>Veículo envolvido: </b>{alerta.veiculo_identificador}</p>
                                            <p><b>Modelo: </b>{alerta.veiculo_modelo}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <div className="direitaAlertas">
                        <MapaAlertas viagemId={viagemSelecionada} mostrarTodos={mostrarTodos} ></MapaAlertas>
                        <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                    </div>
                </div>

                <MenuSuperior></MenuSuperior>
            </>
        )
    }
}