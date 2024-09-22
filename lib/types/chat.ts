// https://github.com/FaridSafi/react-native-gifted-chat
//
import { User } from 'kuzzle'

export interface QuickReplies {
}

export interface IMessage {
  _id: string
  text: string
  createdAt: number
  user: User
  image?: string
  video?: string
  audio?: string
  system?: boolean
  sent?: boolean
  received?: boolean
  pending?: boolean
  quickReplies?: QuickReplies
}

