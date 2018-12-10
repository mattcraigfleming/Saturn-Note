import React, { Component } from "react";
import Markdown from "markdown-to-jsx";
import styled from "styled-components";
import moment from "moment";
import AceEditor from "react-ace";
import brace from "brace";
import "brace/mode/markdown";
import "brace/theme/dracula";
import "./App.css";
import saturn from "./assets/saturn.png";

const settings = window.require("electron-settings");
const { ipcRenderer } = window.require("electron");
const fs = window.require("fs");

class App extends Component {
  constructor() {
    super();
    const directory = settings.get("directory");
    if (directory) {
      this.loadAndReadFiles(directory);
    }
    this.state = {
      loadedFile: "",
      directory: settings.get("directory") || null,
      filesData: [],
      activeIndex: 0,
      createDate: ""
    };
    ipcRenderer.on("new-file", (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
    });

    ipcRenderer.on("save-file", event => {
      this.saveFile();
    });

    ipcRenderer.on("new-dir", (event, directory) => {
      this.setState({
        directory
      });
      settings.set("directory", directory);
      this.loadAndReadFiles(directory);
    });
  }
  componentDidMount() {}

  loadAndReadFiles = directory => {
    fs.readdir(directory, (err, files) => {
      const filteredFiles = files.filter(file => file.includes(".md"));
      const filesData = filteredFiles.map(file => {
        const title = file.substr(
          file.indexOf("/") + 1,
          file.indexOf(".") + file.indexOf("md") + 1
        );
        return {
          title,
          path: `${directory}/${file}`,
          date: new Date()
        };
      });
      filesData.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aSec = aDate.getTime();
        const bSec = bDate.getTime();
        return aSec - bSec;
      });
      this.setState(
        {
          filesData
        },
        () => this.loadFile(0)
      );
    });
  };

  changeFile = index => () => {
    const { activeIndex } = this.state;
    if (index !== activeIndex) {
      this.saveFile();
      this.loadFile(index);
    }
  };

  loadFile = index => {
    const { filesData } = this.state;
    const content = fs.readFileSync(filesData[index].path).toString();
    const stats = fs.stat(filesData[index].path, (err, stat) => {
      const createdAt = moment(stat.birthtime)
        .format("Do MMMM YYYY")
        .toString();
      console.log("Created At : ::::" + JSON.stringify(stat));
      this.setState({
        createDate: createdAt
      });
    });
    this.setState({
      loadedFile: content,
      activeIndex: index,
      stats: stats
    });
  };

  saveFile = () => {
    const { activeIndex, loadedFile, filesData } = this.state;
    fs.writeFile(filesData[activeIndex].path, loadedFile, err => {
      if (err) return console.log(err);
      console.log("saved");
    });
  };

  render() {
    const { activeIndex, directory, filesData, loadedFile } = this.state;
    console.log("Above render console log:::::::" + this.state.time);
    return (
      <AppWrap>
        <Header>Saturn Note</Header>
        {directory ? (
          <Split>
            <FilesWindow>
              {filesData.map((file, index) => (
                <FileButton
                  active={activeIndex === index}
                  onClick={this.changeFile(index)}
                >
                  <p className="title">{file.title}</p>
                  {index === activeIndex ? (
                    <p className="created-at">
                      <span className="created-at-label">created: </span>
                      {this.state.createDate
                        ? this.state.createDate
                        : "did not work"}
                    </p>
                  ) : null}
                </FileButton>
              ))}
            </FilesWindow>
            <CodeWindow>
              <AceEditor
                mode="markdown"
                theme="dracula"
                onChange={newContent => {
                  this.setState({
                    loadedFile: newContent
                  });
                }}
                name="markdown_editor"
                value={loadedFile}
                wrap={true}
                autoScrollEditorIntoView={true}
                setScrollMargin={"10, 10, 10, 10"}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{this.state.loadedFile}</Markdown>
            </RenderedWindow>
          </Split>
        ) : (
          <LoadingMessage>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              className="row"
            >
              <img
                src={saturn}
                alt="saturn"
                width={111}
                height={80}
                style={{ marginBottom: 30 }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              className="row"
            >
              <h1>
                <code> ⌘ + O</code>
              </h1>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              className="row"
            >
              <h1>
                <code style={{ color: "white" }}>Open Workspace</code>
              </h1>
            </div>
          </LoadingMessage>
        )}
      </AppWrap>
    );
  }
}

export default App;

const AppWrap = styled.div`
  padding-top: 2rem;
  background-color: #2b262d;
`;

const FilesWindow = styled.div`
  background: #302b32;
  border-right: solid 1px #302b3a;
  position: relative;
  width: 20%;
  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    box-shadow: -10px 0px 20px rgba(0, 0, 0, 0, 0.3) inset;
  }
`;
const Header = styled.header`
  background-color: #2b262d;
  color: #e06764;
  font-size: 0.8rem;
  height: 23px;
  text-align: center;
  position: fixed;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  -webkit-app-region: drag;
  padding: 2px;
`;

const LoadingMessage = styled.div`
  height: 100vh;
  color: white;
  background-color: #2b262d;
  padding-top: 20%;
`;

const Split = styled.div`
  display: flex;
  height: 100%;
`;

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: #2b262d;
  height: 100vh;
`;

const RenderedWindow = styled.div`
  background-color: #2b262d;
  width: 35%;
  padding: 20px;
  color: white;
  border-left: 1px solid #302b2a;
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #82d8d8;
  }
  h1 {
    border-bottom: solid 3px #e54b4b;
    padding-bottom: 10px;
  }
  hr {
    border: 1px solid #e54b4b !important;
  }
  a {
    color: #e54b4b;
  }
`;

const FileButton = styled.button`
  &:focus {
    outline: 0;
  }
  padding: 10px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  background: #2b262d;
  opacity: 0.4;
  color: #e54b4b;
  border: none;
  box-shadow: 0 4px 2px -2px #3b373f;
  transition: 0.3s ease all;
  &:hover {
    opacity: 1;
    border-left: solid 2px #e54b4b;
    color: white;
  }
  ${({ active }) =>
    active &&
    `
  opacity: 1;
  border-left: solid 4px #e54b4b;
  color: white;
  &:hover {
    opacity: 1;
    border-left: solid 4px #e54b4b;
  }
  `}
  .title {
    font-weight: bold;
    font-size: 0.9rem;
    margin: 0 0 5px;
    padding: 16px;
  }
  .created-at {
    font-size: 0.6rem;
    margin: 0;
    padding: 4px;
    text-align: right;
  }
  .created-at-label {
    font-size: 0.5rem;
  }
`;
