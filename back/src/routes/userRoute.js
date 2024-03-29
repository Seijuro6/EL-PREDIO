const { Router } = require("express");
const bcryptjs = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {
  getUsersDb,
  deleteUser,
  updateUser,
  getUsersActive,
  getUsersInactive,
  getUserById,
} = require("../controllers/userController");
const { User, Reserva, Cancha } = require("../db");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

const router = Router();

router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Error al iniciar sesión" });
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al iniciar sesión" });
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.status(200).json({ token });
    });
  })(req, res, next);
});

// router.get("/home", (req, res) => {
//   // Aquí puedes enviar la respuesta que desees, por ejemplo renderizar una vista
//   res.render("home");
// });

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // En este punto, la autenticación con Google ha sido exitosa.
    // Puedes redirigir al usuario a la página que desees.
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).json({ token });
    // res.redirect("/home");
    // res.redirect("http://localhost:5173/home");
  }
);

router.get("/users", adminMiddleware, getUsersActive);
router.get("/users/inactivos", adminMiddleware, getUsersInactive);

router.get("/users/:id", adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "No se encontró el usuario" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error al obtener usuario mediante ID" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Reserva, as: "reservas", paranoid: false, include: {model: Cancha, as: "cancha"} },
      ],
      paranoid: false,
    });
    if (!user) {
      return res.status(404).json({ message: "No se encontró el usuario" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/users", async (req, res) => {
  let { name, lastName, email, isAdmin, password, phone } = req.body;
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);
    let createUser = await User.create({
      name,
      lastName,
      email,
      isAdmin,
      password: hashPassword,
      phone,
    });
    res.status(201).send(createUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear usuario" });
  }
});

router.put("/users/:id", adminMiddleware, updateUser);

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { name, lastName, email, password, phone } = req.body;

    user.name = name || user.name;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    if (password) {
      const salt = await bcryptjs.genSalt(10);
      const hashPassword = await bcryptjs.hash(password, salt);
      user.password = hashPassword;
    }

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.delete("/users/:id", adminMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await deleteUser(id);
    deletedUser
      ? res.status(200).json({ message: "Usuario eliminado con éxito" })
      : res.status(404).json({ message: "Usuario no encontrado" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
});

module.exports = router;
