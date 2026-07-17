
export function isLogin() {
  const user = localStorage.getItem("user");
  return user ? true : false;
}

export function login(email, pass) {
  const email2 = "admin@gmail.com";
  const pass2 = "admin123";

  if (email === email2 && pass === pass2) {
    const user = {
      name: "Admin",
      email: email,
      phone: "01000000000",
      governorate: "Cairo",
    };
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  }

  return false;
}
export function getUser() {
    const user = localStorage.getItem("user");
    if (!user) return null;
    return JSON.parse(user);
}




export function signup(name, email, phone, governorate) {
  const user = {
    name,
    email,
    phone,
    governorate,
  };

  localStorage.setItem("user", JSON.stringify(user));
  return true;
}


export function getBookById(id) {
  return fetch("books.json")
    .then((res) => res.json())
    .then((books) => {
      const book = books.find((b) => b.id === Number(id));
      return book || null;
    });
}

export function saveBookToCart(id) {
    let cart = localStorage.getItem("cart");
    cart = cart ? JSON.parse(cart) : [];

    const exists = cart.find(item => item === Number(id));

    if (exists) {
        return false;
    }

    cart.push(Number(id));
    localStorage.setItem("cart", JSON.stringify(cart));
    return true;
}


export function getCart() {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
}

export function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item !== Number(id));
    localStorage.setItem("cart", JSON.stringify(cart));
}