curl -X POST http://localhost:3000/api/tenants -H "Content-Type: application/json" -d '{
"tenant": {
"name": "示例大学",
"code": "DEMO4",
"contact": {
"name": "张主任",
"email": "admin@demo.edu",
"phone": "13800138000"
}
},
"admin": {
"username": "admin4",
"password": "admin123",
"name": "张主任",
"email": "admin3@demo.edu",
"phone": "13800138000"
},
"school": {
"name": "示例大学本部",
"code": "DEMO4-01",
"address": "示例市大学路 1 号",
"contact": {
"name": "李校长",
"phone": "13900139000",
"email": "principal@demo.edu"
}
}
}'
