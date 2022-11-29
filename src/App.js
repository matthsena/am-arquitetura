import { useState, Suspense } from "react";
import {
  useHistory,
  useOthers,
  RoomProvider,
  useStorage,
  useMutation,
  useSelf
} from "./liveblocks.config";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { shallow } from "@liveblocks/react";

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
      const shapeId = Date.now().toString();
      const shape = new LiveObject({
        x: getRandomInt(300),
        y: getRandomInt(300),
        fill: getRandomColor(),
        shape: currentShape
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
    ({ setMyPresence }, e) => {
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
          y: e.clientY - 50
        });
      }
    },
    [isDragging]
  );
  // #endregion A
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
        <button onClick={() => insertShape("rectangle")}>Rectangle</button>
        <button onClick={() => insertShape("circle")}>Circle</button>
        <button onClick={() => deleteShape()}>Delete</button>
        <button onClick={() => history.undo()}>Undo</button>
        <button onClick={() => history.redo()}>Redo</button>
      </div>
    </>
  );
}

function Shape({ id, onShapePointerDown }) {
  const { x, y, fill, shape } = useStorage((root) => root.shapes.get(id));

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
    <div
      onPointerDown={(e) => onShapePointerDown(e, id)}
      className={shape}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: !selectedByMe ? "transform 120ms linear" : "none",
        backgroundColor: fill || "#CCC",
        borderColor: selectionColor
      }}
    />
  );
}

export default function App({ roomId }) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ selectedShape: null }}
      initialStorage={{
        shapes: new LiveMap()
      }}
    >
      <Suspense fallback={<Loading />}>
        <Canvas />
      </Suspense>
    </RoomProvider>
  );
}

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

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
