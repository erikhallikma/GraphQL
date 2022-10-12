export const userIdRequest = `
query($login: String) {
    user(where: {login: {_eq: $login}}) {
        id
    }
}`

export const xpRequest = `
query($id: Int, $path: String, $offset: Int) {
    transaction(where: {
        userId: {_eq: $id}
        type: {_eq: "xp"}
        path: {_iregex: $path}
    }
    offset: $offset
    ) {
        amount
    }
}`