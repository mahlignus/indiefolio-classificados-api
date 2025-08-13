const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

class ClassificadoValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    // Carrega o schema
    const schemaPath = path.join(
      __dirname,
      "..",
      "schema",
      "classificado-schema.json"
    );
    this.schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    this.validate = this.ajv.compile(this.schema);
  }

  validateFile(filePath) {
    try {
      console.log(`🔍 Validando ${path.basename(filePath)}...`);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        return false;
      }

      const content = fs.readFileSync(filePath, "utf8");
      let data;

      try {
        data = JSON.parse(content);
      } catch (parseError) {
        console.error(`❌ JSON inválido: ${parseError.message}`);
        return false;
      }

      // Validação do schema
      const isValid = this.validate(data);

      if (!isValid) {
        console.error("❌ Erro(s) de validação do schema:");
        this.validate.errors.forEach((error) => {
          const instancePath = error.instancePath || "raiz";
          console.error(`  • ${instancePath}: ${error.message}`);
          if (error.data !== undefined) {
            console.error(`    Valor recebido: ${JSON.stringify(error.data)}`);
          }
        });
        return false;
      }

      // Validações adicionais
      const additionalValidation = this.validateAdditionalRules(data);
      if (!additionalValidation.isValid) {
        console.error("❌ Erro(s) de validação adicional:");
        additionalValidation.errors.forEach((error) => {
          console.error(`  • ${error}`);
        });
        return false;
      }

      console.log(`✅ ${path.basename(filePath)} é válido!`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao validar arquivo: ${error.message}`);
      return false;
    }
  }

  validateAdditionalRules(data) {
    const errors = [];

    // Validação de IDs únicos
    const ids = new Set();
    const duplicateIds = [];

    data.forEach((classificado, index) => {
      if (ids.has(classificado.id)) {
        duplicateIds.push(classificado.id);
      } else {
        ids.add(classificado.id);
      }

      // Validação de datas
      if (classificado.cadastroEm && classificado.ultimaAtualizacao) {
        const cadastro = new Date(classificado.cadastroEm);
        const atualizacao = new Date(classificado.ultimaAtualizacao);

        if (atualizacao < cadastro) {
          errors.push(
            `Classificado ${classificado.id}: ultima atualização anterior ao cadastro`
          );
        }
      }

      // Validação de expiração
      if (classificado.expiracaoEm) {
        const expiracao = new Date(classificado.expiracaoEm);
        const cadastro = new Date(classificado.cadastroEm);

        if (expiracao < cadastro) {
          errors.push(
            `Classificado ${classificado.id}: data de expiração anterior ao cadastro`
          );
        }
      }

      // Validação de status vs expiração
      if (classificado.status === "finalizado" && !classificado.expiracaoEm) {
        // Opcional: pode ter sido finalizado manualmente
      }
    });

    if (duplicateIds.length > 0) {
      errors.push(`IDs duplicados encontrados: ${duplicateIds.join(", ")}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  getStats(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      const stats = {
        totalClassificados: data.length,
        classificadosAtivos: data.filter((c) => c.status === "ativo").length,
        classificadosPausados: data.filter((c) => c.status === "pausado")
          .length,
        classificadosFinalizados: data.filter((c) => c.status === "finalizado")
          .length,
        funcoes: [...new Set(data.flatMap((c) => c.funcoes))].sort(),
        generos: [...new Set(data.flatMap((c) => c.generos))].sort(),
        estados: [
          ...new Set(data.map((c) => c.local.estado).filter(Boolean)),
        ].sort(),
        cidades: [
          ...new Set(data.map((c) => c.local.cidade).filter(Boolean)),
        ].sort(),
      };

      return stats;
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error.message);
      return null;
    }
  }
}

// Script principal
if (require.main === module) {
  const validator = new ClassificadoValidator();
  const classificadosFile = path.join(__dirname, "..", "classificados.json");

  console.log("🎵 Indiefolio Classificados - Validação");
  console.log("=".repeat(50));

  const isValid = validator.validateFile(classificadosFile);

  if (isValid) {
    const stats = validator.getStats(classificadosFile);
    if (stats) {
      console.log("\\n📊 Estatísticas:");
      console.log(`  • Total de classificados: ${stats.totalClassificados}`);
      console.log(`  • Classificados ativos: ${stats.classificadosAtivos}`);
      console.log(`  • Classificados pausados: ${stats.classificadosPausados}`);
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

  process.exit(isValid ? 0 : 1);
}

module.exports = ClassificadoValidator;
