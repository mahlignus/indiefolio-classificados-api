const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ClassificadoValidator = require("./validate-classificados");

class IncrementalValidator {
  constructor() {
    this.classificadoValidator = new ClassificadoValidator();
    this.classificadosFile = path.join(__dirname, "..", "classificados.json");
    this.classificadosDir = path.join(__dirname, "..", "classificados");
  }

  getChangedFiles() {
    try {
      // Verifica se estamos em um repositório git
      if (!fs.existsSync(path.join(__dirname, "..", ".git"))) {
        console.log(
          "⚠️ Não é um repositório git - validando todos os arquivos"
        );
        return this.getAllRelevantFiles();
      }

      // Pega arquivos staged (preparados para commit)
      const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
        cwd: path.join(__dirname, ".."),
      }).trim();

      if (!stagedFiles) {
        console.log("ℹ️ Nenhum arquivo staged para commit");
        return [];
      }

      const changedFiles = stagedFiles.split("\\n").filter((file) => {
        // Filtra apenas arquivos JSON relevantes
        return (
          file === "classificados.json" ||
          (file.startsWith("classificados/") && file.endsWith(".json"))
        );
      });

      return changedFiles;
    } catch (error) {
      console.log(
        "⚠️ Erro ao detectar arquivos alterados - validando todos:",
        error.message
      );
      return this.getAllRelevantFiles();
    }
  }

  getAllRelevantFiles() {
    const files = ["classificados.json"];

    if (fs.existsSync(this.classificadosDir)) {
      const complementaryFiles = fs
        .readdirSync(this.classificadosDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => `classificados/${file}`);

      files.push(...complementaryFiles);
    }

    return files;
  }

  validateChangedFiles() {
    try {
      const changedFiles = this.getChangedFiles();

      console.log("🎵 Indiefolio Classificados - Validação Incremental");
      console.log("=".repeat(50));

      if (changedFiles.length === 0) {
        console.log("✅ Nenhum arquivo relevante para validar");
        return true;
      }

      console.log(
        `🔍 Validando ${changedFiles.length} arquivo(s) alterado(s):`
      );
      changedFiles.forEach((file) => console.log(`  📄 ${file}`));
      console.log("");

      let hasErrors = false;

      // Valida arquivo principal se foi alterado
      const mainFileChanged = changedFiles.includes("classificados.json");
      if (mainFileChanged) {
        console.log("🔍 Validando arquivo principal...");
        const isMainValid = this.classificadoValidator.validateFile(
          this.classificadosFile
        );
        if (!isMainValid) {
          hasErrors = true;
        }
      }

      // Valida arquivos individuais de classificados alterados
      const individualFiles = changedFiles.filter(
        (file) => file.startsWith("classificados/") && file.endsWith(".json")
      );

      if (individualFiles.length > 0) {
        console.log("\\n🔍 Validando arquivos individuais alterados...");

        for (const file of individualFiles) {
          const filePath = path.join(__dirname, "..", file);

          if (fs.existsSync(filePath)) {
            // Para arquivos individuais, validamos se são JSON válidos
            try {
              const content = fs.readFileSync(filePath, "utf8");
              JSON.parse(content);
              console.log(`✅ ${file} é um JSON válido`);
            } catch (error) {
              console.error(`❌ ${file}: JSON inválido - ${error.message}`);
              hasErrors = true;
            }
          } else {
            console.error(`❌ Arquivo não encontrado: ${file}`);
            hasErrors = true;
          }
        }
      }

      if (!hasErrors) {
        console.log("\\n✅ Todos os arquivos alterados são válidos!");

        // Mostra estatísticas apenas se arquivo principal foi alterado
        if (mainFileChanged) {
          const stats = this.classificadoValidator.getStats(
            this.classificadosFile
          );
          if (stats) {
            console.log("\\n📊 Estatísticas atuais:");
            console.log(
              `  • Total de classificados: ${stats.totalClassificados}`
            );
            console.log(
              `  • Classificados ativos: ${stats.classificadosAtivos}`
            );
            console.log(
              `  • Estados representados: ${
                stats.estados.join(", ") || "Nenhum"
              }`
            );
          }
        }
      }

      return !hasErrors;
    } catch (error) {
      console.error("❌ Erro na validação incremental:", error.message);
      return false;
    }
  }

  // Método para forçar validação completa
  validateAll() {
    console.log("🎵 Indiefolio Classificados - Validação Completa (Forçada)");
    console.log("=".repeat(50));

    // Valida arquivo principal
    const isMainValid = this.classificadoValidator.validateFile(
      this.classificadosFile
    );

    if (isMainValid) {
      const stats = this.classificadoValidator.getStats(this.classificadosFile);
      if (stats) {
        console.log("\\n📊 Estatísticas:");
        console.log(`  • Total de classificados: ${stats.totalClassificados}`);
        console.log(`  • Classificados ativos: ${stats.classificadosAtivos}`);
        console.log(
          `  • Classificados pausados: ${stats.classificadosPausados}`
        );
        console.log(
          `  • Classificados finalizados: ${stats.classificadosFinalizados}`
        );
        console.log(
          `  • Estados representados: ${stats.estados.join(", ") || "Nenhum"}`
        );
        console.log(`  • Funções únicas: ${stats.funcoes.length}`);
        console.log(`  • Gêneros únicos: ${stats.generos.length}`);
      }
    }

    return isMainValid;
  }
}

// Script principal
if (require.main === module) {
  const validator = new IncrementalValidator();

  // Verifica se deve fazer validação completa
  const forceComplete =
    process.argv.includes("--complete") || process.argv.includes("--all");

  let isValid;
  if (forceComplete) {
    isValid = validator.validateAll();
  } else {
    isValid = validator.validateChangedFiles();
  }

  process.exit(isValid ? 0 : 1);
}

module.exports = IncrementalValidator;
