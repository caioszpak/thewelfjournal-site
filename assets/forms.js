/* Formulários do The Welf Journal: envia para o Apps Script (Planilha + Drive + e-mail). */
(function () {
  var MAX_ARQ = 5 * 1024 * 1024, MAX_QTD = 3;
  document.querySelectorAll("form[data-form]").forEach(function (f) {
    var st = f.querySelector(".form-status"), btn = f.querySelector("button[type=submit]");
    function msg(t, ok) { st.textContent = t; st.className = "form-status " + (ok ? "ok" : "erro"); st.hidden = false; }
    function lerArquivo(file) {
      return new Promise(function (res, rej) {
        var r = new FileReader();
        r.onload = function () { res({ nome: file.name, tipo: file.type || "application/octet-stream", b64: String(r.result).split(",")[1] }); };
        r.onerror = rej; r.readAsDataURL(file);
      });
    }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ep = f.getAttribute("data-endpoint");
      if (!ep) { msg("O formulário ainda não está no ar. Volte em breve.", false); return; }
      if (f.elements["site_url"] && f.elements["site_url"].value) { msg("Recebido.", true); return; }
      var arqs = Array.prototype.slice.call(f.querySelectorAll("input[type=file]")).reduce(function (a, i) { return a.concat(Array.prototype.slice.call(i.files)); }, []);
      if (arqs.length > MAX_QTD) { msg("Envie no máximo " + MAX_QTD + " arquivos.", false); return; }
      for (var i = 0; i < arqs.length; i++) {
        if (arqs[i].size > MAX_ARQ) { msg("O arquivo " + arqs[i].name + " passa de 5 MB.", false); return; }
        if (!/\.(pdf|png|jpe?g|webp)$/i.test(arqs[i].name)) { msg("Só PDF, PNG, JPG ou WEBP.", false); return; }
      }
      var campos = {};
      Array.prototype.forEach.call(f.elements, function (el) {
        if (!el.name || el.type === "file" || el.name === "site_url" || el.type === "submit") return;
        if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
        campos[el.name] = campos[el.name] ? campos[el.name] + "; " + el.value : el.value;
      });
      btn.disabled = true; msg("Enviando…", true);
      Promise.all(arqs.map(lerArquivo)).then(function (arquivos) {
        return fetch(ep, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ tipo: f.getAttribute("data-form"), campos: campos, arquivos: arquivos, origem: location.href }) });
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.ok) { f.reset(); msg("Recebemos. Obrigado! Se fizer sentido, a gente responde pelo e-mail que você informou.", true); }
        else { msg((j && j.erro) || "Não deu certo. Tente de novo em alguns minutos.", false); }
      }).catch(function () { msg("Não deu certo. Tente de novo em alguns minutos.", false); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
