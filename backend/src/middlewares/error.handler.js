"use strict";

const AppError= require("../utils/appError")

// Ruta no encontrada
function notFoundHandler(req, res, next){
    next(
        new AppError(
            404,
            `No existe la ruta ${req.method} ${req.originalUrl}.`
        )
    );
}

//Registrar en consola

function logErrors(err, req, res, next){
    console.error("\n--------------Error------------------")
    console.error("Fecha: ", new Date().toISOString());
    console.error("Método: ", req.method);
    console.error("Ruta: ", req.originalUrl)
    console.error("Mensaje: ", err.message )

    if(err.stack){
        console.error(err.stack)
    }
    console.error("\n--------------Error------------------")
    next(err);
    
}

//Respuesta final de Error
function errorHandler(err, req,res, next){
    if(res.headersSent){
        return next(err);
    }

    // Error producido por un JSON mal escrito en el body
    if(err instanceof SyntaxError && err.status === 400 && "body" in err){
        return res.status(400).json({
            error:{
                status: 400,
                message:"El cuerpo del JSON contiene un error de sintaxis",
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Error de validación lanzado por Mongoose (esquema del modelo)
    if(err.name === "ValidationError"){
        return res.status(400).json({
            error:{
                status: 400,
                message: "La información enviada no es válida",
                details: Object.values(err.errors).map((e) => e.message),
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            }
        });
    }

    // ObjectId mal formado (ej. /api/help-points/abc)
    if(err.name === "CastError"){
        return res.status(400).json({
            error:{
                status: 400,
                message: `El valor "${err.value}" no es válido para el campo ${err.path}`,
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Llave duplicada en MongoDB (ej. correo repetido)
    if(err.code === 11000){
        return res.status(400).json({
            error:{
                status: 400,
                message: "Ya existe un registro con ese valor",
                details: Object.keys(err.keyValue || {}),
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Geometría que MongoDB no puede indexar (ej. polígono que se cruza a sí mismo)
    if(err.code === 16755 || /geo keys|Loop is not valid|Edges \d+ and \d+ cross/i.test(err.message || "")){
        return res.status(400).json({
            error:{
                status: 400,
                message: "La geometría no es válida (revisa que el polígono no se cruce consigo mismo)",
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            }
        });
    }

    const statusCode = err.statusCode || 500;
    const message= 
        statusCode=== 500
        ? "Ocurrió un error interno del servidor": err.message;
    res.status(statusCode).json({
        error:{
            status: statusCode,
            message,
            details: err.details || null,
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        }
    });
}

module.exports={
    notFoundHandler,
    logErrors,
    errorHandler
}