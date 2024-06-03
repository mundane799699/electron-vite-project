import "./App.css";

function App() {
  const query = async () => {
    console.log("query-db");
    const data = await window.ipcRenderer.invoke("query-db");
    console.log("data = ", data);
  };

  const insert = async () => {
    console.log("insert");
    await window.ipcRenderer.invoke("insert");
    console.log("insert success");
  };

  return (
    <>
      <div className="card">
        <button onClick={insert}>点击插入</button>
        <button onClick={query}>点击查询</button>
      </div>
    </>
  );
}

export default App;
