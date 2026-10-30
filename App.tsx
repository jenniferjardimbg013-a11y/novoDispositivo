import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { setupDatabase, dbService, Tarefa } from './data/database';

export default function App() {
  const [banco, setBanco] = useState<SQLite.SQLiteDatabase | null>(null);
  const [tarefa, setTarefa] = useState<string>('');
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [listaTarefa, setListaTarefas] = useState<Tarefa[]>([]);


  const [imagemPreviewEdicao, setImagemPreviewEdicao] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const db = await setupDatabase();
      setBanco(db);
      carregarTarefas(db);
    }
    init();
  }, []);

  async function carregarTarefas(db: SQLite.SQLiteDatabase) {
    const dados = await dbService.getAll(db);
    setListaTarefas(dados);
  }


  async function salvarTarefa() {
    if (tarefa.trim() === '' || !banco) return;

    if (idEditando) {

      const tarefaAtual = listaTarefa.find(t => t.id === idEditando);
      await dbService.update(banco, idEditando, tarefa, tarefaAtual?.imagem || null);
      setIdEditando(null);
    } else {

      await dbService.create(banco, tarefa, null);
    }

    setTarefa('');
    setImagemPreviewEdicao(null);
    carregarTarefas(banco);
  }

  async function removerTarefa(id: number) {
    if (!banco) return;
    Alert.alert("Remover livro", "Deseja remover este livro e sua capa?", [
      { text: "Cancelar" },
      {
        text: "Sim", onPress: async () => {
          await dbService.delete(banco, id);
          carregarTarefas(banco);
        }
      }
    ]);
  }

  function prepararEdicao(item: Tarefa) {
    setTarefa(item.nome);
    setIdEditando(item.id);
    setImagemPreviewEdicao(item.imagem || null);
  }


  async function atualizarFotoDaTarefa(idTarefa: number, novaImagem: string | null) {
    if (!banco) return;
    const tarefaAtual = listaTarefa.find(t => t.id === idTarefa);
    if (!tarefaAtual) return;


    await dbService.update(banco, idTarefa, tarefaAtual.nome, novaImagem);
    carregarTarefas(banco);
  }

  async function tirarFoto(idTarefa: number) {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Atenção", "Precisamos de permissão para fotografar a capa.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!resultado.canceled) {
      await atualizarFotoDaTarefa(idTarefa, resultado.assets[0].uri);
    }
  }

  async function abrirGaleria(idTarefa: number) {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!resultado.canceled) {
      await atualizarFotoDaTarefa(idTarefa, resultado.assets[0].uri);
    }
  }

  async function removerFotoTarefa(idTarefa: number) {
    Alert.alert("Remover capa", "Deseja remover a capa deste livro?", [
      { text: "Cancelar" },
      {
        text: "Sim", onPress: async () => {
          await atualizarFotoDaTarefa(idTarefa, null);
        }
      }
    ]);
  }


  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.marca}>CLUBE DO CAPÍTULO   /   01</Text>
        <Text style={styles.titulo}>Minha <Text style={styles.tituloDestaque}>estante.</Text></Text>
        <Text style={styles.subtitulo}>Uma coleção de histórias esperando por você.</Text>
      </View>

      {idEditando && imagemPreviewEdicao && (
        <Image source={{ uri: imagemPreviewEdicao }} style={styles.previewImagemEdicao} />
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.rotulo}>{idEditando ? 'EDITAR TÍTULO' : 'ADICIONAR À ESTANTE'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do livro"
          placeholderTextColor="#89877D"
          value={tarefa}
          onChangeText={setTarefa}
        />
        <TouchableOpacity style={[styles.botao, idEditando ? styles.botaoEditando : {}]} onPress={salvarTarefa}>
          <Text style={styles.textoBotao}>{idEditando ? "Salvar alteração" : "＋  Guardar livro"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listaTarefa}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.cabecalhoLista}>
            <Text style={styles.tituloLista}>Na estante</Text>
            <Text style={styles.contador}>{String(listaTarefa.length).padStart(2, '0')} LIVROS</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioMarca}>▤</Text>
            <Text style={styles.vazioTitulo}>Uma estante em branco</Text>
            <Text style={styles.vazioTexto}>Adicione um livro para começar sua coleção de histórias.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardTarefa}>
            <View style={styles.conteudoTarefa}>
              {item.imagem && (
                <Image source={{ uri: item.imagem }} style={styles.imagemLista} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rotuloLivro}>LIVRO</Text>
                <Text style={styles.textoTarefa}>{item.nome}</Text>
                <View style={styles.containerBotoesFotoTarefa}>
                  {!item.imagem ? (
                    <Text style={styles.textoSemFoto}>SEM CAPA</Text>
                  ) : (
                    <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => removerFotoTarefa(item.id)}>
                      <Text style={styles.textoBotaoAcaoFotoTarefa}>× Capa</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => tirarFoto(item.id)}>
                    <Text style={styles.textoBotaoAcaoFotoTarefa}>＋ Câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoAcaoFotoTarefa} onPress={() => abrirGaleria(item.id)}>
                    <Text style={styles.textoBotaoAcaoFotoTarefa}>＋ Galeria</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>


            <View style={styles.acoes}>
              <TouchableOpacity onPress={() => prepararEdicao(item)}>
                <Text style={styles.textoEditar}>Editar título</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removerTarefa(item.id)}>
                <Text style={styles.textoExcluir}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EFE6', paddingTop: 54, paddingHorizontal: 20 },
  cabecalho: { backgroundColor: '#274C43', borderRadius: 7, padding: 22, marginBottom: 17 },
  marca: { color: '#D6D9B6', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 20 },
  titulo: { color: '#FAF6EB', fontSize: 34, lineHeight: 39, fontWeight: '800', marginBottom: 7 },
  tituloDestaque: { color: '#E8A76A' },
  subtitulo: { color: '#D8E0D3', fontSize: 13, lineHeight: 19 },
  inputContainer: { backgroundColor: '#E4E0D4', padding: 14, borderRadius: 7, marginBottom: 22 },
  rotulo: { color: '#526259', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  input: { backgroundColor: '#F9F7F1', borderWidth: 1, borderColor: '#D5D0C2', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#283D34' },
  botao: { backgroundColor: '#E8A76A', justifyContent: 'center', alignItems: 'center', minHeight: 43, paddingHorizontal: 14, borderRadius: 4, marginTop: 9 },
  botaoEditando: { backgroundColor: '#B9C99D' },
  textoBotao: { color: '#302F27', fontSize: 13, fontWeight: '800' },
  cabecalhoLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  tituloLista: { color: '#283D34', fontSize: 21, fontWeight: '800' },
  contador: { color: '#70766B', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  vazio: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 23, borderWidth: 1, borderColor: '#D4D0C4', borderStyle: 'dashed', borderRadius: 6 },
  vazioMarca: { color: '#C6794B', fontSize: 27, marginBottom: 4 },
  vazioTitulo: { color: '#283D34', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  vazioTexto: { color: '#74766E', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  previewImagemEdicao: { width: 58, height: 78, borderRadius: 3, marginBottom: 12, alignSelf: 'flex-start' },
  cardTarefa: { backgroundColor: '#FBF9F2', borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2DED3', borderLeftWidth: 4, borderLeftColor: '#C6794B', flexDirection: 'column' },
  conteudoTarefa: { flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 12 },
  imagemLista: { width: 58, height: 82, borderRadius: 3, marginRight: 13, backgroundColor: '#D8D5C9' },
  rotuloLivro: { color: '#9A765A', fontSize: 8, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  textoTarefa: { fontSize: 16, lineHeight: 21, color: '#283D34', flexShrink: 1, fontWeight: '800' },
  containerBotoesFotoTarefa: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9, alignItems: 'center' },
  botaoAcaoFotoTarefa: { backgroundColor: '#EAE7DD', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  textoBotaoAcaoFotoTarefa: { color: '#455A4E', fontSize: 10, fontWeight: '700' },
  textoSemFoto: { color: '#85877D', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E8E4DA', paddingTop: 9, gap: 16 },
  textoEditar: { color: '#35624D', fontSize: 11, fontWeight: '800' },
  textoExcluir: { color: '#A95341', fontSize: 11, fontWeight: '800' }
});