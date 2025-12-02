import { NavLink } from "react-router-dom"
import './styles/menuSuperior.css'

import SITREV_TEXT from '../assets/SITREV_TEXT.svg';

export default function MenuSuperior() {
    return (
        <header className="menuSuperiorHeader">
            <nav className="menuSuperior">
                <NavLink to={'/'} end className={"link"}>Início</NavLink>
                <NavLink to={'/cercas'} end className={"link"}>Cercas</NavLink>
                <NavLink to={'/veiculos'} end className={"link"}>Veículos</NavLink>
                <NavLink to={'/motoristas'} end className={"link"}>Motoristas</NavLink>
                <NavLink to={'/registros'} className={"link"}>Registros</NavLink>
                <NavLink to={'/alertas'} className={"link"}>Alertas</NavLink>
                <NavLink to={'/buscar'} className={"link"}>Buscar</NavLink>
            </nav>
            <div>
                <img src={SITREV_TEXT} alt="" className="sitrev_text_logo" />
            </div>
        </header>
    )
}