// https://github.com/FaridSafi/react-native-gifted-chat
export interface IMessage {
  _id: string
  text: string
  createdAt: number
  user: string 
  image?: string
  video?: string
  audio?: string
  system?: boolean
  sent?: boolean
  received?: boolean
  pending?: boolean
  room: string
}
