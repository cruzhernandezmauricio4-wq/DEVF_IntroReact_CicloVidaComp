import React, { useState, useEffect, useRef } from "react";
import "./Bitacora.css";

const CLAVE_STORAGE = "planetas";
const LADO_MAXIMO_IMAGEN = 800;

function cargarPlanetas() {
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
    if (!Array.isArray(guardados)) return [];
    // Los datos de ejemplo no traen id, se lo asignamos para poder editar/eliminar
    return guardados.map((p) => ({
      id: p.id ?? crypto.randomUUID(),
      nombre: p.nombre ?? "",
      descripcion: p.descripcion ?? "",
      imagen: p.imagen ?? null,
    }));
  } catch {
    return [];
  }
}

// Convierte el archivo a data URL (persiste en localStorage, a diferencia de
// URL.createObjectURL) y lo reduce para no agotar el límite de ~5 MB.
function leerImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida."));
      img.onload = () => {
        const escala = Math.min(1, LADO_MAXIMO_IMAGEN / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; // JPEG no tiene transparencia
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

function Bitacora() {
  const [planetas, setPlanetas] = useState(cargarPlanetas);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [error, setError] = useState("");
  const inputImagenRef = useRef(null);
  const formularioRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(planetas));
    } catch {
      setError("No se pudo guardar en el navegador (almacenamiento lleno). Elimina algún planeta o usa imágenes más pequeñas.");
    }
  }, [planetas]);

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setImagen(null);
    setEditandoId(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
  };

  const handleImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      setImagen(await leerImagen(archivo));
      setError("");
    } catch (err) {
      setError(err.message);
      e.target.value = "";
    }
  };

  const quitarImagen = () => {
    setImagen(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen,
    };

    if (editandoId) {
      setPlanetas(planetas.map((p) => (p.id === editandoId ? { ...p, ...datos } : p)));
    } else {
      setPlanetas([...planetas, { id: crypto.randomUUID(), ...datos }]);
    }
    limpiarFormulario();
  };

  const handleEditar = (planeta) => {
    setEditandoId(planeta.id);
    setNombre(planeta.nombre);
    setDescripcion(planeta.descripcion);
    setImagen(planeta.imagen);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
    formularioRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEliminar = (planeta) => {
    if (!window.confirm(`¿Eliminar "${planeta.nombre}" de la bitácora?`)) return;
    setPlanetas(planetas.filter((p) => p.id !== planeta.id));
    if (seleccionadoId === planeta.id) setSeleccionadoId(null);
    if (editandoId === planeta.id) limpiarFormulario();
  };

  const toggleDetalle = (id) => {
    setSeleccionadoId(seleccionadoId === id ? null : id);
  };

  return (
    <section className="bitacora">
      <h2>Bitácora de Exploración</h2>

      <form className="bitacora-form" onSubmit={handleSubmit} ref={formularioRef}>
        <h3>{editandoId ? "Editar planeta" : "Registrar planeta"}</h3>
        <input
          type="text"
          placeholder="Nombre del planeta"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <textarea
          placeholder="Descripción"
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />
        <label className="bitacora-archivo">
          Imagen (opcional)
          <input type="file" accept="image/*" onChange={handleImagen} ref={inputImagenRef} />
        </label>

        {imagen && (
          <div className="bitacora-preview">
            <img src={imagen} alt="Vista previa" />
            <button type="button" onClick={quitarImagen}>
              Quitar imagen
            </button>
          </div>
        )}

        {error && <p className="bitacora-error">{error}</p>}

        <div className="bitacora-acciones">
          <button type="submit">{editandoId ? "Guardar cambios" : "Guardar"}</button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h3>Planetas registrados ({planetas.length})</h3>
      {planetas.length === 0 && <p>Aún no has registrado ningún planeta.</p>}
      <ul className="bitacora-lista">
        {planetas.map((planeta) => {
          const abierto = seleccionadoId === planeta.id;
          return (
            <li key={planeta.id}>
              <div className="bitacora-fila">
                <button
                  type="button"
                  className="bitacora-nombre"
                  aria-expanded={abierto}
                  onClick={() => toggleDetalle(planeta.id)}
                >
                  {abierto ? "▾" : "▸"} {planeta.nombre}
                </button>
                <button type="button" onClick={() => handleEditar(planeta)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleEliminar(planeta)}>
                  Eliminar
                </button>
              </div>
              {abierto && (
                <div className="bitacora-detalle">
                  <p>{planeta.descripcion}</p>
                  {planeta.imagen && <img src={planeta.imagen} alt={planeta.nombre} />}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Bitacora;
