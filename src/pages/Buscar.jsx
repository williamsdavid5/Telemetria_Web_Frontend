import MenuSuperior from "../components/MenuSuperior"
import { useState, useEffect } from "react"
import MapaBuscar from "../components/MapaBuscar"
import '../styles/buscar.css'
import api from "../server/api";

import LoadingGif from '../assets/loadingGif.gif'

export default function Buscar() {

    const [coordenadas, setCoordenadas] = useState();
    const [desenhar, setDesenhar] = useState(null);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [viagensFiltradas, setVIagensFiltradas] = useState([]);
    const [carregando, setCarregando] = useState(false);

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

    async function buscar() {
        if (!coordenadas || coordenadas.length < 3) {
            alert('Selecione uma área no mapa primeiro!');
            return;
        }

        if (!dataInicio || !dataFim) {
            alert('Preencha as datas de início e fim!');
            return;
        }

        if (!validarData(dataInicio) || !validarData(dataFim)) {
            alert('Datas inválidas! Use o formato dd/mm/aaaa');
            return;
        }

        try {
            setCarregando(true);

            const resposta = await api.post('/viagens/area', {
                coordenadas: coordenadas,
                dataInicio: dataInicio,
                dataFim: dataFim
            });

            setVIagensFiltradas(resposta.data);
            console.log('Viagens encontradas:', resposta.data);
        } catch (err) {
            console.error('Erro ao buscar viagens:', err);
            alert('Erro ao buscar viagens na área selecionada');
        } finally {
            setCarregando(false);
        }
    }

    // useEffect(() => {
    //     console.log("coordenadas: ", coordenadas);
    //     console.log("Data inicio: ", dataInicio);
    //     console.log("Data fim: ", dataFim);
    // })

    return (
        <>
            <main className="alertasPage">
                <div className="esquerdaAlertas">
                    <div className="topoEsquerdaAlertasPage">
                        <h2>Buscar</h2>
                        <p>Encontre motoristas e veículos que passaram em uma área específica</p>
                        <div className="pesquisaPorData">
                            <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                className="inputdataCompleto"
                                maxLength={10}
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
                            />
                            <span>até</span>
                            <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                className="inputdataCompleto"
                                maxLength={10}
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
                            />
                        </div>
                        <button className="botaoSelecionarArea" onClick={() => desenhar?.ativarDesenho()}>selecionar área</button>
                        <button
                            className="botaoSelecionarArea"
                            onClick={buscar}
                            disabled={carregando || !coordenadas}
                        >Pesquisar</button>
                    </div>
                    <div className="divRegistros">
                        {carregando && (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <img src={LoadingGif} alt="" style={{ width: '40px', marginTop: '15px' }} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="direitaAlertas">
                    <MapaBuscar setCoordenadas={setCoordenadas} setDesenhar={setDesenhar}></MapaBuscar>
                    <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                </div>
            </main>
            <MenuSuperior></MenuSuperior>
        </>
    )
}