import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MiTurno.css';
import { jsPDF } from 'jspdf';
import baseURL from '../url';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { useParams } from "react-router-dom";

export default function MiTurno() {
    const [turnos, setTurnos] = useState([]);
    const [criterio, setCriterio] = useState(''); // Para buscar por DNI o teléfono
    const [turnoDetalle, setTurnoDetalle] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const { idServicio } = useParams();

    useEffect(() => {
        cargarTurnos();
    }, []);

    const cargarTurnos = () => {
        fetch(`${baseURL}/turnoGet.php`, { method: 'GET' })
            .then((response) => response.json())
            .then((data) => {
                const turnosFiltrados = data.turnos.filter(
                    (turno) => turno.idServicio === parseInt(idServicio)
                );
                setTurnos(turnosFiltrados.reverse() || []);
            })
            .catch((error) => console.error('Error al cargar turnos:', error));
    };

    const openModal = () => setModalIsOpen(true);

    const closeModal = () => {
        setModalIsOpen(false);
        setTurnoDetalle(null);
    };

    const handleInputChange = (e) => setCriterio(e.target.value);

    const buscarTurno = () => {
        const turnoEncontrado = turnos?.find(
            (turno) =>
                (turno.dni === criterio || turno.telefono === criterio) &&
                turno.idServicio === parseInt(idServicio)
        );

        if (turnoEncontrado) {
            setTurnoDetalle(turnoEncontrado);
            Swal.fire({
                title: 'Turno encontrado',
                text: `DNI: ${turnoEncontrado.dni}, Nombre: ${turnoEncontrado.nombre}`,
                icon: 'success',
                confirmButtonText: 'Aceptar',
            });
        } else {
            Swal.fire({
                title: 'Turno no encontrado',
                text: 'No se encontró un turno para este servicio con el criterio ingresado.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
            setTurnoDetalle(null);
        }
    };
    // Función para generar y descargar el PDF
    const descargarTurnoPDF = (detallesTurno) => {
        const doc = new jsPDF();

        // Títulos principales
        doc.setFontSize(22);
        doc.setTextColor("#2c3e50");
        doc.text("Detalles del Turno", 105, 20, null, null, "center");

        // Información del turno
        doc.setFontSize(14);
        doc.setTextColor("#34495e");
        doc.text("Turno N°:", 20, 30);
        doc.text(String(detallesTurno.idTurno), 60, 30);

        doc.text("Servicio:", 20, 40);
        doc.text(String(detallesTurno.servicio), 60, 40);

        doc.setFontSize(16);
        doc.text("Días y Horarios:", 20, 50);

        // Mapeo de los días y horarios
        const dias = JSON.parse(detallesTurno.dias); // Asegúrate de parsear el JSON correctamente
        let yPos = 60; // Posición inicial en Y para los días y horarios

        dias.forEach(dia => {
            doc.setFontSize(14);
            doc.text(`Día: ${new Date(dia.dia).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })}`, 20, yPos);

            doc.text(`Horario: ${dia.horaInicio} - ${dia.horaFin}`, 20, yPos + 10); // Ajusta la posición de la siguiente línea
            yPos += 20; // Espacio entre cada día
        });

        // Información del cliente
        doc.setFontSize(18);
        doc.setTextColor("#2c3e50");
        doc.text("Datos del Cliente", 20, yPos + 10); // Ajusta la posición con el valor de `yPos`

        // Fondo para datos del cliente
        doc.setFillColor("#f7f7f7");
        doc.roundedRect(15, yPos + 15, 180, 40, 5, 5, "F");

        doc.setFontSize(14);
        doc.setTextColor("#34495e");
        doc.text("Nombre:", 20, yPos + 30);
        doc.text(String(detallesTurno.nombre), 60, yPos + 30);

        doc.text("DNI:", 20, yPos + 40);
        doc.text(String(detallesTurno.dni), 60, yPos + 40);

        doc.text("Teléfono:", 20, yPos + 50);
        doc.text(String(detallesTurno.telefono), 60, yPos + 50);

        doc.text("Email:", 20, yPos + 60);
        doc.text(String(detallesTurno.email), 60, yPos + 60);

        // Información del pago
        doc.setFontSize(18);
        doc.setTextColor("#2c3e50");
        doc.text("Detalles del Pago", 20, yPos + 80);

        // Fondo para detalles del pago
        doc.setFillColor("#f7f7f7");
        doc.roundedRect(15, yPos + 85, 180, 20, 5, 5, "F");

        doc.setFontSize(14);
        doc.setTextColor("#34495e");
        doc.text("Método de Pago:", 20, yPos + 100);
        doc.text(String(detallesTurno.pago), 70, yPos + 100);

        // Pie de página
        doc.setFontSize(12);
        doc.setTextColor("#7f8c8d");
        doc.text("Gracias por confiar en nosotros.", 105, 280, null, null, "center");

        // Descargar el PDF
        const nombreArchivo = `Turno_${detallesTurno.idTurno}_${detallesTurno?.nombre?.replace(/\s+/g, '_')}.pdf`;
        doc.save(nombreArchivo);
    };

    const handleUpdateText = async (idTurno) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas cancelar este turno? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, volver',
        });

        if (result.isConfirmed) {
            const payload = { idTurno, estado: 'Cancelado' };
            fetch(`${baseURL}/turnoPut.php?idTurno=${idTurno}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        Swal.fire('Error!', data.error, 'error');
                    } else {
                        Swal.fire('¡Cancelado!', 'El turno fue cancelado correctamente.', 'success');
                        cargarTurnos();
                        setTimeout(() => {
                            window.location.reload();

                        }, 2000);
                    }
                })
                .catch((error) => Swal.fire('Error!', error.message, 'error'));
        }
    };

    return (
        <div>
            <button onClick={openModal} className="emailBtn">
                <span>Mi turno</span> <FontAwesomeIcon icon={faSearch} />
            </button>
            <ToastContainer />
            <Modal
                isOpen={modalIsOpen}
                className="modal-cart"
                overlayClassName="overlay-cart"
                onRequestClose={closeModal}
            >
                <div className="deFLex">
                    <button onClick={closeModal}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <button className="deleteToCart">Mi turno</button>
                </div>
                <div className="paddingConten">
                    <fieldset className="inputSearch">
                        <input
                            type="text"
                            placeholder="Ingrese DNI o Teléfono"
                            value={criterio}
                            onChange={handleInputChange}
                            className="input"
                        />
                        <FontAwesomeIcon
                            icon={faSearch}
                            onClick={buscarTurno}
                            className="search-icon"
                        />
                    </fieldset>
                </div>
                {turnoDetalle && (
                    <div className="MiPedidoContain">
                        <div className="modal-content-cart">
                            <div className="deFlexSpanPedido">
                                <span><strong>Turno N°:</strong> {turnoDetalle.idTurno}</span>
                                <span><strong>Servicio:</strong> {turnoDetalle.servicio}</span>
                                {JSON?.parse(turnoDetalle.dias)?.map((diaInfo, index) => {
                                    // Convertir la fecha al formato adecuado
                                    const fecha = new Date(diaInfo.dia);
                                    const opcionesFormato = { weekday: 'long', day: 'numeric', month: 'long' };
                                    const fechaFormateada = fecha.toLocaleDateString('es-ES', opcionesFormato);

                                    return (
                                        <span key={index}>
                                            <strong>Fecha:</strong> {fechaFormateada} - {diaInfo.horaInicio} - {diaInfo.horaFin}
                                        </span>
                                    );
                                })}
                                <span><strong>Estado:</strong> {turnoDetalle.estado}</span>
                                <span><strong>Nombre:</strong> {turnoDetalle.nombre}</span>
                                <span><strong>DNI:</strong> {turnoDetalle.dni}</span>
                                <span><strong>Email:</strong> {turnoDetalle.email}</span>
                                <span><strong>Teléfono:</strong> {turnoDetalle.telefono}</span>
                                <span><strong>Pago:</strong> {turnoDetalle.pago}</span>


                            </div>
                            <div className="deFlexBtnTienda">
                                <button onClick={() => descargarTurnoPDF(turnoDetalle)} className="btn">
                                    Descargar
                                </button>
                                {turnoDetalle.estado !== 'Cancelado' && (
                                    <button className="btn" onClick={() => handleUpdateText(turnoDetalle.idTurno)}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
