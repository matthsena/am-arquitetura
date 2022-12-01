import { useState, Suspense } from "react";
import {
  useHistory,
  useOthers,
  RoomProvider,
  useStorage,
  useMutation,
  useSelf,
} from "./liveblocks.config";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { shallow } from "@liveblocks/react";
import { v4 as uuidv4 } from "uuid";

function Canvas() {
  // #region Funções base
  const [isDragging, setIsDragging] = useState(false);

  const shapeIds = useStorage(
    (root) => Array.from(root.shapes.keys()),
    shallow
  );

  const history = useHistory();

  const insertShape = useMutation(
    ({ storage, setMyPresence }, currentShape) => {
      const shapeId = uuidv4();
      const shape = new LiveObject({
        x: getRandomInt(300),
        y: getRandomInt(300),
        deg: 0,
        fill: getRandomColor(),
        shape: currentShape,
      });
      storage.get("shapes").set(shapeId, shape);
      setMyPresence({ selectedShape: shapeId }, { addToHistory: true });
    },
    []
  );

  const deleteShape = useMutation(({ storage, self, setMyPresence }) => {
    const shapeId = self.presence.selectedShape;
    storage.get("shapes").delete(shapeId);
    setMyPresence({ selectedShape: null });
  }, []);

  // FUNÇÃO PARA QUADRADO SE MOVER
  const onShapePointerDown = useMutation(
    ({ setMyPresence }, e, shapeId) => {
      history.pause();
      e.stopPropagation();

      setMyPresence({ selectedShape: shapeId }, { addToHistory: true });
      setIsDragging(true);
    },
    [history]
  );

  // CLICOU NO CANVAS
  const onCanvasPointerUp = useMutation(
    ({ setMyPresence }) => {
      if (!isDragging) {
        setMyPresence({ selectedShape: null }, { addToHistory: true });
      }
      setIsDragging(false);
      history.resume();
    },
    [isDragging, history]
  );

  // MOVEU O MOUSE
  const onCanvasPointerMove = useMutation(
    ({ storage, self }, e) => {
      e.preventDefault();
      if (!isDragging) {
        return;
      }

      const shapeId = self.presence.selectedShape;
      const shape = storage.get("shapes").get(shapeId);

      if (shape) {
        shape.update({
          x: e.clientX - 50,
          y: e.clientY - 50,
        });
      }
    },
    [isDragging]
  );
  // #endregion A

  const rotateShape = useMutation(({ storage, self, setMyPresence }) => {
    const shapeId = self.presence.selectedShape;
    const shape = storage.get("shapes").get(shapeId);
    const currentDeg = shape._map.get("deg");

    if (shape) {
      shape.update({
        deg: currentDeg + 45,
      });
    }
    //storage.get("shapes").delete(shapeId);
    //setMyPresence({ selectedShape: null });
  }, []);
  return (
    <>
      <div
        className="canvas"
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
      >
        {shapeIds.map((shapeId) => {
          return (
            <Shape
              key={shapeId}
              id={shapeId}
              onShapePointerDown={onShapePointerDown}
            />
          );
        })}
      </div>
      <div className="toolbar">
        <button onClick={() => insertShape("rectangle")}>Cama</button>
        <button onClick={() => insertShape("circle")}>Circulo</button>
        <button onClick={() => rotateShape()}>Rotacionar</button>
        <button onClick={() => deleteShape()}>Deletar</button>
        <button onClick={() => history.undo()}>Desfazer</button>
        <button onClick={() => history.redo()}>Refazer</button>
      </div>
    </>
  );
}

function Shape({ id, onShapePointerDown }) {
  const { x, y, deg, fill, shape } = useStorage((root) => root.shapes.get(id));
  console.log("UPDATE X E Y E DEG", x, y, deg);
  const selectedByMe = useSelf((me) => me.presence.selectedShape === id);
  const selectedByOthers = useOthers((others) =>
    others.some((other) => other.presence.selectedShape === id)
  );
  const selectionColor = selectedByMe
    ? "blue"
    : selectedByOthers
    ? "green"
    : "transparent";

  return (
    <img
      onPointerDown={(e) => onShapePointerDown(e, id)}
      className={shape}
      src="https://www.decoracoesmoveis.com.br/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/a/cama_casal_turim_-_imbuia_01_1.jpg"
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${deg}deg)`,
        transition: !selectedByMe ? "transform 120ms linear" : "none",
        backgroundColor: fill || "#CCC",
        borderColor: selectionColor,
      }}
      id={id}
      onClick={() => console.log("Clicou aqui", id)}
    />
  );
}

export default function App({ roomId }) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ selectedShape: null }}
      initialStorage={{
        shapes: new LiveMap(),
      }}
    >
      <Suspense fallback={<Loading />}>
        <Canvas />
      </Suspense>
    </RoomProvider>
  );
}

const COLORS = ["#fff"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomColor() {
  return COLORS[getRandomInt(COLORS.length)];
}

function Loading() {
  return (
    <div className="loading">
      <img src="https://liveblocks.io/loading.svg" alt="Loading" />
    </div>
  );
}
