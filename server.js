const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

const port = 8081;

const menu = `
Indiefolio Classificados API
============================

1. Listar classificados: GET /classificados.json
2. Obter classificado específico: GET /classificado/:id
3. Obter estatísticas: GET /estatisticas.json

`;

app.get("/", (req, res) => {
  res.send(menu);
});

app.get("/classificado/:id", (req, res) => {
  const idClassificado = req.params.id;
  const filePath = path.join(
    __dirname,
    "classificados",
    `${idClassificado}.json`
  );
  console.log(`Tentando servir classificado ${idClassificado}:`, filePath);
  const stream = fs.createReadStream(filePath);
  stream.on("error", (err) => {
    console.error(`Erro ao abrir ${filePath}:`, err);
    res.status(404).send(`Arquivo ${filePath} não encontrado!`);
  });
  stream.pipe(res);
});

app.get("/classificados.json", (req, res) => {
  const filePath = path.join(__dirname, "classificados.json");
  console.log(`Tentando servir classificados.json:`, filePath);
  const stream = fs.createReadStream(filePath);
  stream.on("error", (err) => {
    console.error("Erro ao abrir classificados.json:", err);
    res.status(404).send("Arquivo classificados.json não encontrado!");
  });
  stream.pipe(res);
});

app.get("/estatisticas.json", (req, res) => {
  const estatisticasPath = path.join(__dirname, "estatisticas.json");
  console.log(`Tentando servir estatísticas:`, estatisticasPath);
  const stream = fs.createReadStream(estatisticasPath);
  stream.on("error", (err) => {
    console.error("Erro ao abrir estatisticas.json:", err);
    res.status(404).send("Arquivo estatisticas.json não encontrado!");
  });
  stream.pipe(res);
});

app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Servidor rodando em ${url}`);
  console.log("Acesse o menu de opções:");
  console.log("Menu de opções:");
  console.log(`1. Listar classificados: ${url}/classificados.json`);
  console.log(`2. Obter classificado específico: ${url}/classificado/:id`);
  console.log(`3. Obter estatísticas: ${url}/estatisticas.json`);
});
