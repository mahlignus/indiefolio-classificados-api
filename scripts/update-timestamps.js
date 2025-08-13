const fs = require("fs");
const path = require("path");

class TimestampUpdater {
  constructor() {
    this.classificadosFile = path.join(__dirname, "..", "classificados.json");
  }

  updateTimestamps() {
    try {
      console.log("🕐 Atualizando timestamps dos classificados...");

      if (!fs.existsSync(this.classificadosFile)) {
        console.log("⚠️ Arquivo classificados.json não encontrado");
        return true;
      }

      const data = JSON.parse(fs.readFileSync(this.classificadosFile, "utf8"));
      let hasChanges = false;
      const now = new Date().toISOString();

      data.forEach((classificado, index) => {
        // Se não tem ultimaAtualizacao, adiciona
        if (!classificado.ultimaAtualizacao) {
          classificado.ultimaAtualizacao = classificado.cadastroEm || now;
          hasChanges = true;
        }

        // Se não tem cadastroEm, adiciona (caso de dados antigos)
        if (!classificado.cadastroEm) {
          classificado.cadastroEm = classificado.ultimaAtualizacao || now;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        fs.writeFileSync(
          this.classificadosFile,
          JSON.stringify(data, null, 2),
          "utf8"
        );
        console.log("✅ Timestamps atualizados com sucesso!");
      } else {
        console.log("ℹ️ Nenhuma atualização de timestamp necessária");
      }

      return true;
    } catch (error) {
      console.error("❌ Erro ao atualizar timestamps:", error.message);
      return false;
    }
  }

  // Atualiza apenas a ultimaAtualizacao para todos os classificados ativos
  touchActiveClassificados() {
    try {
      console.log(
        "🕐 Atualizando última modificação dos classificados ativos..."
      );

      if (!fs.existsSync(this.classificadosFile)) {
        console.log("⚠️ Arquivo classificados.json não encontrado");
        return true;
      }

      const data = JSON.parse(fs.readFileSync(this.classificadosFile, "utf8"));
      const now = new Date().toISOString();
      let updated = 0;

      data.forEach((classificado) => {
        if (classificado.status === "ativo") {
          classificado.ultimaAtualizacao = now;
          updated++;
        }
      });

      if (updated > 0) {
        fs.writeFileSync(
          this.classificadosFile,
          JSON.stringify(data, null, 2),
          "utf8"
        );
        console.log(`✅ ${updated} classificado(s) ativo(s) atualizados!`);
      } else {
        console.log("ℹ️ Nenhum classificado ativo encontrado para atualizar");
      }

      return true;
    } catch (error) {
      console.error(
        "❌ Erro ao atualizar classificados ativos:",
        error.message
      );
      return false;
    }
  }
}

// Script principal
if (require.main === module) {
  const updater = new TimestampUpdater();

  console.log("🎵 Indiefolio Classificados - Atualizador de Timestamps");
  console.log("=".repeat(50));

  // Verifica argumentos
  const touchActive = process.argv.includes("--touch-active");

  let success;
  if (touchActive) {
    success = updater.touchActiveClassificados();
  } else {
    success = updater.updateTimestamps();
  }

  process.exit(success ? 0 : 1);
}

module.exports = TimestampUpdater;
