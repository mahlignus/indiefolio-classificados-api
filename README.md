# 🎵 Indiefolio Classificados API

API pública opensource para classificados de bandas independentes brasileiras.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Sobre

Esta API fornece acesso aos classificados de bandas e músicos independentes brasileiros cadastrados na plataforma Indiefolio. Os classificados incluem anúncios de busca por membros para bandas, formação de novos grupos, e oportunidades de colaboração musical.

## 🚀 Endpoints

### Base URL

```
http://localhost:8081
```

### Listar todos os classificados

```http
GET /classificados.json
```

**Resposta:**

```json
[
  {
    "id": "classificado-001",
    "titulo": "Procuro guitarrista para banda de rock",
    "descricao": "Banda de rock procura guitarrista para apresentações e gravações...",
    "funcoes": ["guitarrista"],
    "generos": ["rock", "rock alternativo"],
    "local": {
      "pais": "Brasil",
      "estado": "SP",
      "cidade": "São Paulo"
    },
    "banda": {
      "nome": "Exemplo Band",
      "avatar": "EB"
    },
    "contatos": {
      "email": "contato@exemploband.com",
      "fone": "(11) 99999-9999"
    },
    "cadastroEm": "2024-01-15T10:30:00.000Z",
    "emailCadastro": "usuario@exemplo.com",
    "ultimaAtualizacao": "2024-01-15T10:30:00.000Z",
    "status": "ativo"
  }
]
```

### Obter classificado específico

```http
GET /classificado/:id
```

**Parâmetros:**

- `id` (string): ID único do classificado

### Obter estatísticas

```http
GET /estatisticas.json
```

**Resposta:**

```json
{
  "totalClassificados": 42,
  "classificadosAtivos": 35,
  "classificadosPausados": 3,
  "classificadosFinalizados": 4,
  "funcoesMaisProcuradas": [
    { "funcao": "guitarrista", "count": 15 },
    { "funcao": "baixista", "count": 12 }
  ],
  "generosMaisPopulares": [
    { "genero": "rock", "count": 20 },
    { "genero": "metal", "count": 8 }
  ],
  "distribuicaoPorEstado": {
    "SP": 18,
    "RJ": 12,
    "MG": 8
  },
  "ultimaAtualizacao": "2024-01-15T10:30:00.000Z"
}
```

## 📊 Estrutura dos Dados

### Classificado

| Campo               | Tipo   | Obrigatório | Descrição                                |
| ------------------- | ------ | ----------- | ---------------------------------------- |
| `id`                | string | ✅          | Identificador único                      |
| `titulo`            | string | ✅          | Título do classificado                   |
| `descricao`         | string | ❌          | Descrição detalhada                      |
| `funcoes`           | array  | ✅          | Funções procuradas                       |
| `generos`           | array  | ✅          | Gêneros musicais                         |
| `local`             | object | ✅          | Localização                              |
| `banda`             | object | ❌          | Dados da banda (se aplicável)            |
| `contatos`          | object | ✅          | Informações de contato                   |
| `cadastroEm`        | string | ✅          | Data/hora do cadastro (ISO 8601)         |
| `emailCadastro`     | string | ✅          | Email do usuário que cadastrou           |
| `ultimaAtualizacao` | string | ✅          | Data/hora da última atualização          |
| `status`            | string | ❌          | Status: "ativo", "pausado", "finalizado" |

### Funções Comuns

- guitarrista
- baixista
- baterista
- vocal
- tecladista
- violinista
- saxofonista
- trompetista

### Gêneros Populares

- rock
- metal
- punk
- indie
- pop
- blues
- jazz
- sertanejo
- mpb

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 16+
- Git

### Instalação

```bash
git clone https://github.com/mahlignus/indiefolio-classificados-api.git
cd indiefolio-classificados-api
npm install
```

### Scripts Disponíveis

#### Desenvolvimento

```bash
npm run dev                    # Inicia servidor de desenvolvimento
```

#### Validação

```bash
npm run validate              # Validação incremental (apenas arquivos alterados)
npm run validate-all          # Validação completa
npm run validate-classificados # Validação específica dos classificados
```

#### Manutenção

```bash
npm run update-timestamps     # Atualiza timestamps
npm run generate-changelog    # Gera changelog das mudanças
npm run generate-statistics   # Gera estatísticas
npm run generate-tag          # Gera nova tag de versão
```

#### Git Hooks

```bash
npm run pre-commit           # Executa validações antes do commit
```

## 📁 Estrutura do Projeto

```
├── classificados/           # Arquivos individuais de classificados
├── history/                # Histórico de mudanças
├── schema/                 # Schemas de validação JSON
├── scripts/                # Scripts de validação e manutenção
├── classificados.json      # Lista principal de classificados
├── estatisticas.json       # Estatísticas atuais
├── server.js              # Servidor Express
├── CHANGELOG.md           # Log de mudanças
└── package.json           # Configurações do projeto
```

## ✅ Validação

A API utiliza validação rigorosa baseada em JSON Schema:

- **Estrutura**: Todos os campos obrigatórios devem estar presentes
- **Tipos**: Validação de tipos de dados (string, array, object)
- **Formatos**: Validação de emails, URLs e datas ISO 8601
- **Unicidade**: IDs únicos para cada classificado
- **Consistência**: Validação cruzada entre campos relacionados

### Executar Validação

```bash
npm run validate
```

## 📈 Estatísticas

As estatísticas são geradas automaticamente e incluem:

- Total de classificados por status
- Funções mais procuradas
- Gêneros mais populares
- Distribuição geográfica
- Tendências temporais
- Métricas de atividade

### Gerar Estatísticas

```bash
npm run generate-statistics
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Processo de Adição de Classificados

**⚠️ Importante:** A adição de classificados é **manual e controlada**.

1. Classificados são enviados via formulário no site principal
2. Passam por processo de validação manual
3. São adicionados após aprovação
4. Seguem padrões rigorosos de qualidade

Não aceitamos PRs diretos para adição de classificados. Use o formulário oficial.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎯 Roadmap

- [ ] Filtros avançados por localização
- [ ] API de busca textual
- [ ] Sistema de favoritos
- [ ] Notificações por email
- [ ] Integração com redes sociais
- [ ] Dashboard administrativo

## 📞 Contato

- **Projeto**: [Indiefolio](https://indiefolio.com.br)
- **Autor**: Rafael Mahl
- **Email**: contato@indiefolio.com.br

---

**🎵 Construído com ❤️ para a comunidade musical independente brasileira**
