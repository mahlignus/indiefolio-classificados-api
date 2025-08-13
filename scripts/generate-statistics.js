const fs = require("fs");
const path = require("path");

class StatisticsGenerator {
  constructor() {
    this.classificadosFile = path.join(__dirname, "..", "classificados.json");
    this.statisticsFile = path.join(__dirname, "..", "estatisticas.json");
  }

  generateStatistics() {
    try {
      console.log("📊 Gerando estatísticas dos classificados...");

      if (!fs.existsSync(this.classificadosFile)) {
        console.log("⚠️ Arquivo classificados.json não encontrado");
        return false;
      }

      const data = JSON.parse(fs.readFileSync(this.classificadosFile, "utf8"));
      const stats = this.calculateStatistics(data);

      // Salva estatísticas
      fs.writeFileSync(
        this.statisticsFile,
        JSON.stringify(stats, null, 2),
        "utf8"
      );

      console.log("✅ Estatísticas geradas com sucesso!");
      this.printStatistics(stats);

      return true;
    } catch (error) {
      console.error("❌ Erro ao gerar estatísticas:", error.message);
      return false;
    }
  }

  calculateStatistics(data) {
    const now = new Date();
    const stats = {
      totalClassificados: data.length,
      classificadosAtivos: 0,
      classificadosPausados: 0,
      classificadosFinalizados: 0,
      classificadosExpirados: 0,
      funcoesMaisProcuradas: [],
      generosMaisPopulares: [],
      distribuicaoPorEstado: {},
      distribuicaoPorStatus: {},
      mediaClassificadosPorMes: 0,
      ultimosClassificados: [],
      classificadosRecentes: 0, // últimos 30 dias
      tempoMedioAtivo: 0, // em dias
      ultimaAtualizacao: now.toISOString(),
    };

    const funcoesCount = {};
    const generosCount = {};
    const statusCount = {};
    const estadosCount = {};
    const classificadosPorMes = {};

    data.forEach((classificado) => {
      // Contagem por status
      const status = classificado.status || "ativo";
      statusCount[status] = (statusCount[status] || 0) + 1;

      // Verifica se expirado
      if (classificado.expiracaoEm) {
        const expiracao = new Date(classificado.expiracaoEm);
        if (expiracao < now && status === "ativo") {
          stats.classificadosExpirados++;
        }
      }

      // Contagem de funções
      if (classificado.funcoes && Array.isArray(classificado.funcoes)) {
        classificado.funcoes.forEach((funcao) => {
          const funcaoLower = funcao.toLowerCase();
          funcoesCount[funcaoLower] = (funcoesCount[funcaoLower] || 0) + 1;
        });
      }

      // Contagem de gêneros
      if (classificado.generos && Array.isArray(classificado.generos)) {
        classificado.generos.forEach((genero) => {
          const generoLower = genero.toLowerCase();
          generosCount[generoLower] = (generosCount[generoLower] || 0) + 1;
        });
      }

      // Contagem por estado
      if (classificado.local && classificado.local.estado) {
        const estado = classificado.local.estado;
        estadosCount[estado] = (estadosCount[estado] || 0) + 1;
      }

      // Classificados por mês
      if (classificado.cadastroEm) {
        const cadastroDate = new Date(classificado.cadastroEm);
        const mesAno = `${cadastroDate.getFullYear()}-${String(
          cadastroDate.getMonth() + 1
        ).padStart(2, "0")}`;
        classificadosPorMes[mesAno] = (classificadosPorMes[mesAno] || 0) + 1;

        // Classificados recentes (últimos 30 dias)
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        if (cadastroDate >= thirtyDaysAgo) {
          stats.classificadosRecentes++;
        }
      }
    });

    // Estatísticas básicas por status
    stats.classificadosAtivos = statusCount.ativo || 0;
    stats.classificadosPausados = statusCount.pausado || 0;
    stats.classificadosFinalizados = statusCount.finalizado || 0;
    stats.distribuicaoPorStatus = statusCount;

    // Top funções mais procuradas
    stats.funcoesMaisProcuradas = Object.entries(funcoesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([funcao, count]) => ({ funcao, count }));

    // Top gêneros mais populares
    stats.generosMaisPopulares = Object.entries(generosCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genero, count]) => ({ genero, count }));

    // Distribuição por estado
    stats.distribuicaoPorEstado = Object.entries(estadosCount)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [estado, count]) => {
        acc[estado] = count;
        return acc;
      }, {});

    // Média de classificados por mês
    const mesesComDados = Object.keys(classificadosPorMes).length;
    if (mesesComDados > 0) {
      const totalClassificadosComData = Object.values(
        classificadosPorMes
      ).reduce((a, b) => a + b, 0);
      stats.mediaClassificadosPorMes =
        Math.round((totalClassificadosComData / mesesComDados) * 100) / 100;
    }

    // Últimos classificados (5 mais recentes)
    stats.ultimosClassificados = data
      .filter((c) => c.cadastroEm)
      .sort((a, b) => new Date(b.cadastroEm) - new Date(a.cadastroEm))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        titulo: c.titulo,
        funcoes: c.funcoes,
        cadastroEm: c.cadastroEm,
        status: c.status,
      }));

    // Tempo médio ativo (para classificados finalizados)
    const classificadosFinalizadosComDatas = data.filter(
      (c) => c.status === "finalizado" && c.cadastroEm && c.ultimaAtualizacao
    );

    if (classificadosFinalizadosComDatas.length > 0) {
      const tempoTotal = classificadosFinalizadosComDatas.reduce((total, c) => {
        const inicio = new Date(c.cadastroEm);
        const fim = new Date(c.ultimaAtualizacao);
        const dias = (fim - inicio) / (1000 * 60 * 60 * 24);
        return total + dias;
      }, 0);

      stats.tempoMedioAtivo =
        Math.round(
          (tempoTotal / classificadosFinalizadosComDatas.length) * 100
        ) / 100;
    }

    return stats;
  }

  printStatistics(stats) {
    console.log("\\n📊 Estatísticas dos Classificados:");
    console.log("=".repeat(40));
    console.log(`📋 Total de classificados: ${stats.totalClassificados}`);
    console.log(`✅ Ativos: ${stats.classificadosAtivos}`);
    console.log(`⏸️ Pausados: ${stats.classificadosPausados}`);
    console.log(`✅ Finalizados: ${stats.classificadosFinalizados}`);
    console.log(`⏰ Expirados: ${stats.classificadosExpirados}`);
    console.log(`🆕 Recentes (30 dias): ${stats.classificadosRecentes}`);

    if (stats.funcoesMaisProcuradas.length > 0) {
      console.log("\\n🎸 Top 5 Funções Mais Procuradas:");
      stats.funcoesMaisProcuradas.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.funcao}: ${item.count}`);
      });
    }

    if (stats.generosMaisPopulares.length > 0) {
      console.log("\\n🎵 Top 5 Gêneros Mais Populares:");
      stats.generosMaisPopulares.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.genero}: ${item.count}`);
      });
    }

    if (Object.keys(stats.distribuicaoPorEstado).length > 0) {
      console.log("\\n🗺️ Top 5 Estados:");
      Object.entries(stats.distribuicaoPorEstado)
        .slice(0, 5)
        .forEach(([estado, count], index) => {
          console.log(`  ${index + 1}. ${estado}: ${count}`);
        });
    }

    if (stats.mediaClassificadosPorMes > 0) {
      console.log(
        `\\n📈 Média de classificados por mês: ${stats.mediaClassificadosPorMes}`
      );
    }

    if (stats.tempoMedioAtivo > 0) {
      console.log(`⏱️ Tempo médio ativo: ${stats.tempoMedioAtivo} dias`);
    }
  }
}

// Script principal
if (require.main === module) {
  const generator = new StatisticsGenerator();

  console.log("🎵 Indiefolio Classificados - Gerador de Estatísticas");
  console.log("=".repeat(50));

  const success = generator.generateStatistics();
  process.exit(success ? 0 : 1);
}

module.exports = StatisticsGenerator;
