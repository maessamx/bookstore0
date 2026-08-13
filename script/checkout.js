document.addEventListener("DOMContentLoaded", initCheckout);

async function initCheckout() {
  const user = getUser();
  if (!user) { location.href = "/login/"; return; }

  $("#coName").value = user.name || "";
  $("#coPhone").value = user.phone || "";
  $("#coGov").value = user.governorate || "Cairo";

  const cart = getCart();
  if (!cart.length) {
    $("#coItems").innerHTML = `<p class="muted center" style="padding:18px 0">Your cart is empty.</p>`;
    $("#coPlace").disabled = true;
    return;
  }

  await renderSummary();
  bindEvents(user);
}

async function renderSummary() {
  const cart = getCart();
  const rows = await Promise.all(cart.map(async it => ({ it, item: await resolveItem(it.id, it.kind) })));
  let html = "", subtotal = 0;
  for (const { it, item } of rows) {
    if (!item) continue;
    subtotal += item.price * it.qty;
    const img = it.kind === "supply" ? productArt(item) : cover(item);
    html += `
      <div class="co-item">
        <img src="${img}" alt="${esc(item.title)}" onerror="imgErr(this)">
        <div class="ci-info">
          <div class="ci-title">${esc(item.title)}</div>
          <div class="ci-sub">${it.kind === "supply" ? esc(item.category) : esc(item.author)} · Qty ${it.qty}</div>
        </div>
        <b>${money(item.price * it.qty)}</b>
      </div>`;
  }
  $("#coItems").innerHTML = html;
  subtotal = +subtotal.toFixed(2);
  const shipping = subtotal >= 30 ? 0 : 5;
  $("#coSubtotal").textContent = money(subtotal);
  $("#coShipping").textContent = shipping === 0 ? "FREE" : money(shipping);
  $("#coTotal").textContent = money(subtotal + shipping);
}

function bindEvents(user) {
  $("#coPlace").addEventListener("click", async () => {
    const name = $("#coName").value.trim();
    const phone = $("#coPhone").value.trim();
    const address = $("#coAddress").value.trim();
    if (!name || !phone || !address) return toast("Please fill in name, phone and address", "warn");

    const cart = getCart();
    const rows = await Promise.all(cart.map(async it => ({ it, item: await resolveItem(it.id, it.kind) })));
    const items = rows
      .filter(r => r.item)
      .map(r => ({ id: r.item.id, title: r.item.title, price: r.item.price, qty: r.it.qty, kind: r.it.kind }));
    if (!items.length) return toast("Your cart is empty", "warn");

    const subtotal = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
    const shipping = subtotal >= 30 ? 0 : 5;
    const total = +(subtotal + shipping).toFixed(2);
    const gov = $("#coGov").value;
    const notes = $("#coNotes").value.trim();

    const order = {
      id: "ORD-" + Date.now().toString().slice(-6),
      userId: user.id, customer: name, email: user.email,
      items, subtotal, shipping, total,
      governorate: gov, city: $("#coCity").value.trim(), address,
      notes, payment: $("#coPay").value,
      status: "pending", date: new Date().toISOString(),
    };
    await Data.orders.add(order);
    saveCart([]);
    updateCartBadge();

    await Data.users.update(user.id, { name, phone, governorate: gov });
    store.set("bk_session", { ...user, name, phone, governorate: gov });

    $("#ordId").textContent = order.id;
    $("#ordCount").textContent = items.reduce((s, i) => s + i.qty, 0);
    $("#ordPay").textContent = order.payment;
    $("#ordTotal").textContent = money(total);
    openModal("coSuccess");
    toast("Order placed successfully!", "success");
  });
}
