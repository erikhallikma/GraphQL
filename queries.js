export const userIdRequest = `
query($login: String) {
    user(where: {login: {_eq: $login}}) {
        id
    }
}`

//for some reason piscine-js also includes the points that you should get in the div part
//so i excluded all xp with type piscine
export const piscineXpRequest = `
query($id: Int, $path: String, $offset: Int) {
    transaction(where: {
        userId: {_eq: $id}
        type: {_eq: "xp"}
        path: {_iregex: $path}
        _not: {object: {type: {_eq: "piscine"}}}
    }
    offset: $offset
    ) {
        object {
            type
        }
        amount
        createdAt
    }
}`

//separate request for div xp since this has to include piscine type
export const divTaskIdRequest = `
query($id: Int, $offset: Int) {
    progress(where: {
        userId: { _eq: $id }
        _and: [
            {grade: {_neq: NaN}},
            {grade: {_neq: 0}}
        ]
        _or: [
            {object: {type: {_eq: "project"}}},
            {object: {type: {_eq: "piscine"}}}
        ]
    }
    offset: $offset
    ) {
        objectId
    }
}`

export const xpAmountRequest = `
query($objectId: Int, $userId: Int){
    transaction(where:{
        userId: {_eq: $userId}
        objectId: {_eq: $objectId}
        type: {_eq: "xp"}
    }) {
        objectId
        createdAt
        amount
        path
    }
}`

export const auditXpRequest = `
query($userId: Int, $offset: Int){
    transaction(where:{
        userId: {_eq: $userId}
        _or: [
            {type: {_eq: "down"}}
            {type: {_eq: "up"}}
        ]
    }
    offset: $offset
    ) {
        amount
        type
    }
}`