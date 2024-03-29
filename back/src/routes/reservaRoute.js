const router = require("express").Router();
const {
  getAllReservations,
  deleteReserva,
  updateReserva,
  getUsersDb,
  payReserver,
} = require("../controllers/ReservaControllers");
const { Reserva, Cancha, User } = require("../db");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");
// const mercadopago = require("../utils/mercadoPago");

router
  .get("/", adminMiddleware, async (req, res) => {
    try {
      const allReservations = await getAllReservations();
      res.status(200).send(allReservations);
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })

  .get("/:id", adminMiddleware, async (req, res) => {
    const id = req.params.id;
    // let allreserva = await getAllReservations();
    // try {
    //   if (id) {
    //     const reservaid = await allreserva.filter((el) => el.id == id);
    //     id.length
    //       ? res.status(200).send(reservaid)
    //       : res
    //           .status(500)
    //           .json({ message: "Error al obtener Reserva por ID" });
    //   }
    // } catch (error) {
    //   throw error;
    // }
    try {
      if (id) {
        const reserva = await Reserva.findOne({
          where: {
            id: id,
          },
          include: [
            {
              model: Cancha,
              as: "cancha",
            },
            {
              model: User,
              as: "user",
            },
          ],
        });

        if (reserva) {
          res.status(200).send(reserva);
        } else {
          res.status(500).json({ message: "Error al obtener Reserva por ID" });
        }
      } else {
        res.status(400).json({ message: "No se especificó un ID válido" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error al buscar la reserva" });
    }
  })

  .post("/", authMiddleware, async (req, res) => {
    const { date, start, end, status, hasPromo, userId, canchaId } = req.body;
    try {
      const reservation = await Reserva.create({
        date,
        start,
        end,
        status,
        hasPromo,
        userId,
        canchaId,
      });
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Error al crear la reserva" });
    }
  })
  .post("/pagos", payReserver)

  .delete("/:id", adminMiddleware, async (req, res) => {
    const id = req.params.id;
    try {
      const deletedReserva = await deleteReserva(id);
      deletedReserva
        ? res.status(200).json({ message: "Reserva eliminada con éxito" })
        : res.status(404).json({ message: "Reserva no encontrada" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar la Reserva" });
    }
  })

  .put("/", adminMiddleware, async (req, res) => {
    const { id, date, start, end, status, hasPromo } = req.body;

    if (id && (date || start || end || status || hasPromo)) {
      try {
        const reservaUpdate = await updateReserva(
          id,
          date,
          start,
          end,
          status,
          hasPromo
        );
        return res.status(200).json(reservaUpdate);
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ error: "Error al actualizar la reserva" });
      }
    } else {
      return res.status(400).json({ message: error });
    }
  });

module.exports = router;
