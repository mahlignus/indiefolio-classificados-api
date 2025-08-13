const fs = require("fs");
const path = require("path");

class ChangelogGenerator {
  constructor() {
    this.classificadosFile = path.join(__dirname, "..", "classificados.json");
    this.changelogFile = path.join(__dirname, "..", "CHANGELOG.md");
    this.historyFile = path.join(__dirname, "..", "history", "changes.json");
  }

  generateChangelog() {
    try {
      console.log("📝 Gerando changelog...");

      // Carrega dados atuais
      const data = this.loadCurrentData();
      if (!data) return false;

      // Carrega histórico anterior
      const previousHistory = this.loadPreviousHistory();

      // Detecta mudanças
      const changes = this.detectChanges(data, previousHistory);

      if (changes.length === 0) {
        console.log("ℹ️ Nenhuma mudança detectada");
        return true;
      }

      // Atualiza arquivo de histórico
      this.updateHistory(data, changes);

      // Gera/atualiza changelog
      this.updateChangelogFile(changes);

      console.log(`✅ Changelog atualizado com ${changes.length} mudança(s)`);
      return true;
    } catch (error) {
      console.error("❌ Erro ao gerar changelog:", error.message);
      return false;
    }
  }

  loadCurrentData() {
    try {
      if (!fs.existsSync(this.classificadosFile)) {
        console.log("⚠️ Arquivo classificados.json não encontrado");
        return [];
      }
      return JSON.parse(fs.readFileSync(this.classificadosFile, "utf8"));
    } catch (error) {
      console.error("❌ Erro ao carregar dados atuais:", error.message);
      return null;
    }
  }

  loadPreviousHistory() {
    try {
      if (!fs.existsSync(this.historyFile)) {
        return [];
      }
      return JSON.parse(fs.readFileSync(this.historyFile, "utf8"));
    } catch (error) {
      console.log("⚠️ Erro ao carregar histórico anterior, iniciando novo");
      return [];
    }
  }

  detectChanges(currentData, previousHistory) {
    const changes = [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Pega o último snapshot do histórico
    const lastSnapshot =
      previousHistory.length > 0
        ? previousHistory[previousHistory.length - 1]
        : { date: null, totalClassificados: 0, classificados: [] };

    const currentTotal = currentData.length;
    const previousTotal = lastSnapshot.totalClassificados || 0;

    // Detecta novos classificados
    const previousIds = new Set(
      (lastSnapshot.classificados || []).map((c) => c.id)
    );
    const newClassificados = currentData.filter((c) => !previousIds.has(c.id));

    if (newClassificados.length > 0) {
      newClassificados.forEach((classificado) => {
        changes.push({
          type: "add",
          date: today,
          classificado: {
            id: classificado.id,
            titulo: classificado.titulo,
            funcoes: classificado.funcoes,
            local: classificado.local,
          },
          message: `Novo classificado: ${classificado.titulo}`,
        });
      });
    }

    // Detecta classificados removidos (comparando com snapshot anterior)
    const currentIds = new Set(currentData.map((c) => c.id));
    const removedClassificados = (lastSnapshot.classificados || []).filter(
      (c) => !currentIds.has(c.id)
    );

    if (removedClassificados.length > 0) {
      removedClassificados.forEach((classificado) => {
        changes.push({
          type: "remove",
          date: today,
          classificado: {
            id: classificado.id,
            titulo: classificado.titulo,
          },
          message: `Classificado removido: ${classificado.titulo}`,
        });
      });
    }

    // Detecta mudanças de status
    if (lastSnapshot.classificados) {
      const previousClassificadosMap = new Map(
        lastSnapshot.classificados.map((c) => [c.id, c])
      );

      currentData.forEach((current) => {
        const previous = previousClassificadosMap.get(current.id);
        if (previous && previous.status !== current.status) {
          changes.push({
            type: "status_change",
            date: today,
            classificado: {
              id: current.id,
              titulo: current.titulo,
            },
            message: `Status alterado de "${previous.status}" para "${current.status}": ${current.titulo}`,
            details: {
              from: previous.status,
              to: current.status,
            },
          });
        }
      });
    }

    return changes;
  }

  updateHistory(currentData, changes) {
    try {
      const history = this.loadPreviousHistory();
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Cria snapshot atual
      const snapshot = {
        date: today,
        timestamp: now.toISOString(),
        totalClassificados: currentData.length,
        classificadosAtivos: currentData.filter((c) => c.status === "ativo")
          .length,
        classificados: currentData.map((c) => ({
          id: c.id,
          titulo: c.titulo,
          status: c.status,
          funcoes: c.funcoes,
          generos: c.generos,
          local: c.local,
        })),
        changes: changes,
      };

      history.push(snapshot);

      // Mantém apenas os últimos 50 snapshots para não crescer indefinidamente
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error("❌ Erro ao atualizar histórico:", error.message);
    }
  }

  updateChangelogFile(changes) {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Cabeçalho do arquivo
      let changelogContent = "# Changelog - Indiefolio Classificados API\n\n";
      changelogContent +=
        "Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.\n\n";

      // Seção de hoje
      if (changes.length > 0) {
        changelogContent += `## ${today}\n\n`;

        // Agrupa por tipo
        const addedCount = changes.filter((c) => c.type === "add").length;
        const removedCount = changes.filter((c) => c.type === "remove").length;
        const statusChanges = changes.filter(
          (c) => c.type === "status_change"
        ).length;

        if (addedCount > 0) {
          changelogContent += `### ✅ Adicionados (${addedCount})\n\n`;
          changes
            .filter((c) => c.type === "add")
            .forEach((change) => {
              const local =
                [
                  change.classificado.local.cidade,
                  change.classificado.local.estado,
                ]
                  .filter(Boolean)
                  .join(", ") || "Localização não especificada";
              changelogContent += `- **${
                change.classificado.titulo
              }** (${change.classificado.funcoes.join(", ")}) - ${local}\n`;
            });
          changelogContent += "\n";
        }

        if (removedCount > 0) {
          changelogContent += `### ❌ Removidos (${removedCount})\n\n`;
          changes
            .filter((c) => c.type === "remove")
            .forEach((change) => {
              changelogContent += `- ${change.classificado.titulo}\n`;
            });
          changelogContent += "\n";
        }

        if (statusChanges > 0) {
          changelogContent += `### 🔄 Status Alterados (${statusChanges})\n\n`;
          changes
            .filter((c) => c.type === "status_change")
            .forEach((change) => {
              changelogContent += `- **${change.classificado.titulo}**: ${change.details.from} → ${change.details.to}\n`;
            });
          changelogContent += "\n";
        }
      }

      // Se já existe changelog, preserva conteúdo anterior
      if (fs.existsSync(this.changelogFile)) {
        const existingContent = fs.readFileSync(this.changelogFile, "utf8");

        // Encontra onde começam as entradas antigas (após a primeira seção de data)
        const firstDateMatch = existingContent.match(/\n## \d{4}-\d{2}-\d{2}/);
        if (firstDateMatch) {
          const oldEntries = existingContent.substring(firstDateMatch.index);
          // Evita duplicar a entrada de hoje
          if (!oldEntries.includes(`## ${today}`)) {
            changelogContent += oldEntries;
          } else {
            // Se já existe entrada de hoje, substitui apenas essa seção
            const nextDateMatch = oldEntries
              .substring(1)
              .match(/\n## \d{4}-\d{2}-\d{2}/);
            if (nextDateMatch) {
              changelogContent += oldEntries.substring(nextDateMatch.index + 1);
            }
          }
        }
      }

      fs.writeFileSync(this.changelogFile, changelogContent);
    } catch (error) {
      console.error(
        "❌ Erro ao atualizar arquivo de changelog:",
        error.message
      );
    }
  }
}

// Script principal
if (require.main === module) {
  const generator = new ChangelogGenerator();

  console.log("🎵 Indiefolio Classificados - Gerador de Changelog");
  console.log("=".repeat(50));

  const success = generator.generateChangelog();
  process.exit(success ? 0 : 1);
}

module.exports = ChangelogGenerator;
