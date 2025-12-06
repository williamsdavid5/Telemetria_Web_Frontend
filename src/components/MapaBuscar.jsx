import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-polylinedecorator';
import { useMapEvent } from 'react-leaflet';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';
import pontoIcon from '../assets/pontoIcon.png';
import startIcon from '../assets/startIcon.png';
import alertaIcon from '../assets/alertaIcon.png'; // ADICIONADO

import loadingGif from '../assets/loadingGif.gif'

import mapProviders from '../utils/mapProviders';

import ModalCerca from './ModalCerca';

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'pontoIcon' // opcional
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'startIcon' // opcional
});

// ADICIONADO: Ícone de alerta
const alertaIconObj = new L.Icon({
    iconUrl: alertaIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'iconeAlerta'
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

        // Linha pontilhada
        const linha = L.polyline(latlngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10' // padrão de linha pontilhada
        }).addTo(map);

        // Setas de direção (maiores e mais visíveis)
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25, // início da primeira seta
                    repeat: 150, // espaçamento entre setas
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16, // tamanho da seta (maior)
                        polygon: true,
                        pathOptions: {
                            color: '#007bff',
                            fillOpacity: 1,
                            weight: 1,
                            opacity: 0.9
                        }
                    })
                }
            ]
        }).addTo(map);

        return () => {
            map.removeLayer(linha);
            map.removeLayer(decorator);
        };
    }, [map, pontos]);

    return null;
}

//para que as viagens não fiquem sempre visíveis
function MapaClickReset({ setViagemSelecionada }) {
    useMapEvent('click', () => {
        // Quando o usuário clicar em qualquer parte do mapa (não em markers)
        setViagemSelecionada(null);
    });

    return null;
}

// essa função é responsável por configurar os controles padrões do leaflet, dar funções a eles
function ControladorDesenho({
    layerRefs,
    setNovaCercaCoordenadas,
    setCoordenadas,
    onReady
}) {
    const map = useMap();
    const poligoneref = useRef(null);
    const [pontosMarcados, setPontosMarcados] = useState([]);

    const ativarDesenho = () => {
        const drawPolygon = new L.Draw.Polygon(map);
        drawPolygon.enable();
    };

    useEffect(() => {
        if (!map) return;
        if (onReady) {
            onReady({
                ativarDesenho
            });
        }
    }, [map]);


    useEffect(() => {
        if (map._drawControlAdded) return;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: false,
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
            }
        });

        map.addControl(drawControl);
        map._drawControlAdded = true;
        map._drawnItems = drawnItems;


        map.on(L.Draw.Event.CREATED, function (event) {
            const layer = event.layer;

            if (event.layerType === 'polygon') {

                const latlngs = layer.getLatLngs()[0];
                const coordenadas = latlngs.map(coord => [coord.lat, coord.lng]);

                if (poligoneref.current) {
                    map.removeLayer(poligoneref.current);
                }

                layer.addTo(map);
                poligoneref.current = layer;

                setNovaCercaCoordenadas(coordenadas);
                setCoordenadas(coordenadas);
            }

            if (event.layerType === 'marker') {
                const { lat, lng } = layer.getLatLng();
                setPontosMarcados(prev => [...prev, [lat, lng]]);
                drawnItems.addLayer(layer);
            }
        });

    }, [map]);

    return null;
};


function abrirNoMaps(lat, lng) {
    if (!lat || !lng) {
        console.warn("Coordenadas inválidas para compartilhamento.");
        return;
    }

    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    // se estiver em um dispositivo mobile, tenta abrir o app do Maps
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const link = isMobile ? `geo:${lat},${lng}?q=${lat},${lng}` : url;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;

    window.open(link, "_blank");
}

async function compartilharLocalizacao(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    const mensagem = `Veja minha localização: ${url}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Minha localização",
                text: mensagem,
                url,
            });
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        }
    } else {
        // fallback: abre WhatsApp
        const linkWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(linkWhatsapp, "_blank");
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

function Centralizar({ coordenadas }) {
    const map = useMap();
    useEffect(() => {
        if (coordenadas) {
            map.setView(coordenadas, 16);
        }
    }, [coordenadas]);
    return null;
}

export default function MapaBuscar({ setCoordenadas, setDesenhar, viagem }) {

    const layerRefs = useRef({});
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);
    const [viagens, setViagens] = useState(null);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);

    const [carregandoViagem, setCarregandoViagem] = useState(false);

    const [registroViagem, setRegistroViagem] = useState(null);
    const [posicaoAtual, setPosicaoAtual] = useState(null);
    const [currentProvider, setCurrentProvider] = useState(mapProviders.default);

    useEffect(() => {
        async function carregarDetalhesViagem() {
            if (viagem?.id) {
                try {
                    setCarregandoViagem(true);
                    const resposta = await api.get(`/viagens/${viagem.id}`);
                    setRegistroViagem(resposta.data);

                    if (resposta.data?.registros?.length > 0) {
                        const ultimo = resposta.data.registros.at(-1);
                        const coords = [parseFloat(ultimo.latitude), parseFloat(ultimo.longitude)];
                        setPosicaoAtual(coords);
                    }
                } catch (err) {
                    console.log('Erro ao carregar detalhes da viagem:', err);
                } finally {
                    setCarregandoViagem(false);
                }
            } else {
                setRegistroViagem(null);
            }
        }

        carregarDetalhesViagem();
    }, [viagem]);

    return (
        <div className='mapa'>
            <MapContainer center={posicaoAtual || [-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />
                <Centralizar coordenadas={posicaoAtual} />
                <ControladorDesenho
                    layerRefs={layerRefs}
                    setNovaCercaCoordenadas={setNovaCercaCoordenadas}
                    setCoordenadas={setCoordenadas}
                    onReady={setDesenhar}
                />

                {registroViagem?.registros?.length > 0 && (() => {
                    const pontosFiltrados = registroViagem.registros.filter(p => p.latitude && p.longitude);

                    return (
                        <>
                            {pontosFiltrados.map((ponto, index) => {
                                const position = [parseFloat(ponto.latitude), parseFloat(ponto.longitude)];
                                const horario = formatarDataHora(ponto.timestamp);
                                const velocidade = parseFloat(ponto.velocidade) || 0;
                                const limite = parseFloat(ponto.limite_aplicado) || 0;

                                // Lógica para verificar excesso de velocidade (igual ao MapaPercurso)
                                const pontoTemAlerta = velocidade > limite;

                                // Define o ícone baseado na verificação de velocidade
                                const iconToUse = pontoTemAlerta
                                    ? alertaIconObj // Ícone de alerta para excesso de velocidade
                                    : (index === 0 ? starPercursotIcon : pontoPercursoIcon);

                                return (
                                    <Marker key={ponto.id || index} position={position} icon={iconToUse}>
                                        <Popup>
                                            <div>
                                                {pontoTemAlerta && (
                                                    <>
                                                        <b style={{ color: 'red' }}>EXCESSO DE VELOCIDADE</b><br />
                                                        <b>Velocidade:</b> {velocidade.toFixed(1)} km/h<br />
                                                        <b>Limite:</b> {limite.toFixed(1)} km/h<br />
                                                        <b>Diferença:</b> +{(velocidade - limite).toFixed(1)} km/h<br />
                                                    </>
                                                )}
                                                {index === 0 && !pontoTemAlerta && (
                                                    <>
                                                        <b style={{ color: 'green' }}>📍 INÍCIO DO PERCURSO</b><br />
                                                    </>
                                                )}
                                                {!pontoTemAlerta && index !== 0 && (
                                                    <>
                                                        <b>Velocidade:</b> {velocidade.toFixed(1)} km/h<br />
                                                        <b>Limite:</b> {limite.toFixed(1)} km/h<br />
                                                    </>
                                                )}
                                                <b>Horário:</b> {horario}<br />
                                                {ponto.chuva ? '🌧️ Chuva detectada' : '☀️ Tempo seco'} <br />
                                                <button
                                                    onClick={() => abrirNoMaps(position[0], position[1])}
                                                    className='botaoPopUpMapa'
                                                >
                                                    Google maps
                                                </button><br />
                                                <button
                                                    onClick={() => compartilharLocalizacao(position[0], position[1])}
                                                    className='botaoPopUpMapa'
                                                >
                                                    Compartilhar localização
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            <LinhaComSetas pontos={pontosFiltrados} />

                            {pontosFiltrados.length > 0 && (
                                <Marker
                                    position={[
                                        parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude),
                                        parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude)
                                    ]}
                                    icon={vehicleIcon}
                                >
                                    <Popup>
                                        <div>
                                            <b>🚗 VEÍCULO</b><br />
                                            <b>Posição atual do veículo</b><br />
                                            <b>Motorista:</b> {registroViagem?.nome_motorista || 'Não informado'}<br />
                                            <b>Veículo:</b> {registroViagem?.modelo_veiculo || 'Não informado'} - {registroViagem?.identificador_veiculo || 'Não informado'}<br />
                                            <b>Última atualização:</b> {formatarDataHora(pontosFiltrados[pontosFiltrados.length - 1].timestamp)}
                                            <br />
                                            <button
                                                onClick={() => abrirNoMaps(
                                                    parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude),
                                                    parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude)
                                                )}
                                                className='botaoPopUpMapa'
                                            >
                                                Google maps
                                            </button><br />
                                            <button
                                                onClick={() => compartilharLocalizacao(
                                                    parseFloat(pontosFiltrados[pontosFiltrados.length - 1].latitude),
                                                    parseFloat(pontosFiltrados[pontosFiltrados.length - 1].longitude)
                                                )}
                                                className='botaoPopUpMapa'
                                            >
                                                Compartilhar localização
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </>
                    );
                })()}

                {registroViagem?.alertas?.length > 0 && registroViagem.alertas.map((alerta, index) => {
                    const pontosAlerta = alerta.registros?.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]);

                    return (
                        <div key={index}>
                            {pontosAlerta?.length > 1 && (
                                <Polyline
                                    positions={pontosAlerta}
                                    color="red"
                                    weight={4}
                                    opacity={0.8}
                                />
                            )}
                        </div>
                    );
                })}

            </MapContainer>

            <div className='janelaProviders'>
                {/* select do provider */}
                <p className='pJanelaProviders'>Estilo de mapa:</p>
                <select
                    name="providerSelect"
                    id="providerSelect"
                    value={currentProvider}
                    onChange={(e) => setCurrentProvider(e.target.value)}
                    className="map-provider-select"
                >
                    {Object.entries(mapProviders)
                        .filter(([id]) => id !== 'default')
                        .map(([id, provider]) => (
                            <option key={id} value={id}>
                                {provider.name}
                            </option>
                        ))}
                </select>
            </div>

            {carregandoViagem && (
                <div className='divCarregando'>
                    <img src={loadingGif} alt="" />
                    <p> <b>Carregando dados, aguarde...</b> </p>
                </div>
            )}

        </div>
    );
}