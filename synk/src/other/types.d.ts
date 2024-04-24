interface minimaluser {
    id: number;
    image: string;
    name: string;
}

interface extendeduser {
    user: minimaluser;
    status: boolean;
    room?: {
        id: number;
        name: string;
    }
}

interface UserChatMessage {
    author: minimaluser;
    timestamp: number;
    message: string;
}

interface minimalroomuser {
    isadmin: boolean;
    user: minimaluser;
}

interface extendedroom {
    id: number;
    starttime: number;
    name: string;
    members: minimalroomuser[]
}

interface friendrequest {
    requester: extendeduser,
    id: number,
    created_time: number,
}

interface globalInitialData {
    username: string;
    userid: number;
    friendrequests: friendrequest[];
    image: string;
}

interface ssglobaldata {
    shoutbox: UserChatMessage[]
    onlineusers: minimaluser[]
    onlineFriends: extendeduser[]
}

interface userProfilePage {
    id: number,
    username: string,
    online: boolean,
    joined: number,
    friendRequestSent: boolean,
    requestAccepted: boolean,
    receivedRequest: boolean,
    image: string
}

interface roomdata {
    id: number,
    roomname: string,
    admincontrolsonly: boolean,
    chatenabled: boolean,
    creation: string,
    current_url: string,
    current_video_playing: boolean,
    current_video_progress: string,
    current_video_progress_time: string,
    users: minimalroomuser[],
    invitecode: string
}

interface lastplayobject{
    playing: boolean,
    progress: number,
    progressTime: number
}

interface globalstate {
    loggedin: boolean;
    setloggedin: Dispatch<SetStateAction<boolean>>;
    globalInitialData: globalInitialData,
    setglobalInitialData: Dispatch<SetStateAction<globalInitialData>>;
    useSocketInstance: {
        connect: () => Promise<void>;
        subscribeToEvent: (type: string, callback: (data: object) => void) => void;
        unsubscribeToEvent: (type: string, callback: (data: object) => void) => void
        send: (type: string, message: object) => Promise<void>;
        connected: boolean;
        socket: any;
        clientserverdelta: number | undefined;
        authsuccess: boolean;
    }
}