

app.post('/login', function(request, response) {

    var username = request.body.username;
    var password = request.body.password;

    if(username == 'demo' && password == 'demo'){
        request.session.regenerate(function(){
        request.session.user = username;
        response.redirect('/restricted');
        });
    }
    else {
       res.redirect('login');
    }
});

app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    });
});

app.get('/restricted', restrict, function(request, response){
  response.send('This is the restricted area! Hello ' + request.session.user + '! click <a href="/logout">here to logout</a>');
});

app.listen(8124, function(){
    console.log('Server running...');
});
