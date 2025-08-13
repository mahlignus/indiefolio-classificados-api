const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const classificadosPath = path.join(__dirname, "..", "classificados.json");

function gerarIdUnico(titulo, cadastroEm) {
  const entrada = `${titulo}_${cadastroEm}`;
  return crypto
    .createHash("sha1")
    .update(entrada)
    .digest("hex")
    .substring(0, 8);
}

function main() {
  console.log("🔧 Gerando IDs únicos para classificados...");

  if (!fs.existsSync(classificadosPath)) {
    console.error("❌ Arquivo classificados.json não encontrado!");
    process.exit(1);
  }

  let alterado = false;
  const data = JSON.parse(fs.readFileSync(classificadosPath, "utf8"));
  console.log(`📋 Processando ${data.length} classificados...`);

  data.forEach((classificado, index) => {
    console.log(
      `🔍 Verificando classificado ${index + 1}: "${classificado.titulo}"`
    );
    if (!classificado.id || classificado.id.trim() === "") {
      classificado.id = gerarIdUnico(
        classificado.titulo,
        classificado.cadastroEm
      );
      alterado = true;
      console.log(
        `🆔 ID gerado para '${classificado.titulo}': ${classificado.id}`
      );
    } else {
      console.log(`✅ Classificado já possui ID: ${classificado.id}`);
    }
  });

  if (alterado) {
    fs.writeFileSync(classificadosPath, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ IDs gerados e arquivo atualizado.");
  } else {
    console.log("ℹ️ Todos os classificados já possuem ID.");
  }
}

if (require.main === module) {
  main();
}
