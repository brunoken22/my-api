import { API_BASE_URL, ref, onValue, app, getDatabase } from "./db";
import { Router } from "@vaadin/router";
const API_URL = "http://localhost:3000";
type Play = "stone" | "papper" | "sissors" | string;
const state = {
   data: {
      gameState: {
         currentPage: null,
         name: "",
         userId: "",
         roomId: "",
         rtdb: "",
         online: false,
         owner: true,
         play: null,
         opponentName: "",
         opponentPlay: null,
         opponentConect: false,
      },
      gameReady: false,
      playersReady: false,
      score: {
         you: 0,
         oponent: 0,
      },
   },
   listeners: [],
   async listenersRoom(idRtdb) {
      const db = getDatabase(app);
      const refRoom = ref(db, "rooms/" + idRtdb + "/data");
      onValue(refRoom, (snapshot) => {
         const valor = snapshot.val();
         this.setState(valor);
      });
   },

   //Enviar datos para la rtdb
   async pushEstate() {
      const cs = await this.getState();

      await fetch(API_URL + "/rooms/" + cs.gameState.rtdb, {
         method: "post",
         headers: {
            "content-type": "application/json",
         },
         body: JSON.stringify(cs),
      });
   },

   //Enviar datos del oponente
   // async pushOponent() {
   //    const cs = await this.getState();

   //    await fetch(API_URL + "/rooms/" + cs.gameState.rtdb, {
   //       method: "post",
   //       headers: {
   //          "content-type": "application/json",
   //       },
   //       body: JSON.stringify(cs),
   //    });
   // },

   async getState() {
      const cs = await this.data;
      return cs;
   },
   setState(newState) {
      this.data = newState;
      for (let cb of this.listeners) {
         cb();
      }
   },

   //AGREGGA TU NOMBRE AL STATE
   async setName(name: string) {
      const { gameState } = await this.getState();
      gameState.name = name;
   },

   // crea un usuario en fireStore
   async signIn() {
      const cs = await this.getState();

      const newUser = await fetch(API_URL + "/auth", {
         method: "post",
         headers: {
            "content-type": "application/json",
         },
         body: JSON.stringify(cs),
      });

      const user = await newUser.json();

      const usrId = await user.id;
      cs.gameState.userId = usrId;
      this.setState(cs);
   },

   // crea un room en la rtdb para el owner de la sala

   async askNewRoom() {
      await this.signIn();
      const cs = await this.getState();

      const rawPublicRoomId = await fetch(`${API_URL}/rooms`, {
         method: "post",
         headers: {
            "content-type": "application/json",
         },
         body: JSON.stringify(cs.gameState),
      });

      const pId = await rawPublicRoomId.json();
      const { id } = await pId;
      await this.getExistingRoomId(id);
      cs.gameState.roomId = id;
      this.setState(cs);
   },

   // obtiene el id de la rtdb y lo guarda en el state

   async getExistingRoomId(roomId: string) {
      const cs = await this.getState();
      const rawPrivateRoomId = await fetch(`${API_URL}/rooms/${roomId}`);
      const privateRoomIdParse = await rawPrivateRoomId.json();
      const rtdbRoomId = await privateRoomIdParse.rtdbRoom;
      cs.gameState.rtdb = rtdbRoomId;
      this.setState(cs);
   },

   async subscribe(cb) {
      this.listeners.push(cb);
      console.log("El state a cambiado", this.data);
   },
};

export { state };
