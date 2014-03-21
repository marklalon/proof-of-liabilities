var complete_tree;
var partial_trees = {};

// dirty hack to prepopulate verify tab
var n = 0;
function twice(fn) {
  if (n === 2) return;
  n++;
  fn();
}

function error (e, tab) {
  $('#' + tab + '_results').hide(); 
  $('#' + tab + ' .flash h4').html(e.name || 'Error');
  $('#' + tab + ' .flash p').html(e.message || e);
  $('#' + tab + ' .flash').show(); 
}

function serialize (obj) {
  return JSON.stringify(obj, undefined, 2);
}

function format (obj) {
  data = obj.data;
  if (!data) return '';

  var res = '';
  var sep = '';
  ['user', 'nonce', 'sum', 'hash'].forEach(function (prop) {
    if (prop in data) {
      res += sep;
      if (prop === 'user') {
        res += '<span class="label label-primary">' + data[prop] + '</span>';
      }
      else if (prop === 'nonce') {
        res += '<span class="label label-default">' + data[prop] + '</span>';
      }
      else {
        res += data[prop];
      }
      sep = ', ';
    }
  });
  return res;
}

// Track tab in URL
// see http://stackoverflow.com/questions/12131273/twitter-bootstrap-tabs-url-doesnt-change
$(function(){
  var hash = window.location.hash;
  hash && $('.navbar-nav a[href="' + hash + '"]').tab('show');

  $('.navbar-nav a').click(function (e) {
    $(this).tab('show');
    var scrollmem = $('body').scrollTop();
    window.location.hash = this.hash;
    $('html,body').scrollTop(scrollmem);
  });
});

// Generate
$(function () {
  $('input[name="format"]').on('change', function () {
    var format = this.value;
    $('.pretty').toggle();
    $('.json').toggle();
  });

  $('.json').toggle();

  $('#btn_generate').on('click', function (e) {
    e.preventDefault();
    $('#generate .flash').hide();

    complete_tree = null;
    partial_trees = {};

    var accounts;

    try {
      accounts = JSON.parse($('#accounts').val());
    }
    catch (err) {
      error(err, 'generate');
    }

    complete_tree = blproof.generateCompleteTree(accounts);

    var root = complete_tree.root();

    //@hack
    twice(function () {
      $('#expected_root').html(blproof.serializeRoot(complete_tree));
    });

    $('#complete_tree').html(serialize(complete_tree));
    $('#complete_tree_pretty').html(complete_tree.prettyPrintStr(format));
    $('#root').html(blproof.serializeRoot(complete_tree));

    // Populate select
    var html = '';
    accounts.forEach(function (account) {
      html += '<option>';
      html += account.user;
      html += '</option>';
    });
    $('#select_account').html(html);
    $('#select_account').trigger('change');

    $('#generate_results').show();
  });

  $('#select_account').on('change', function () {
    var user = this.value;
    var partial_tree = partial_trees[user];
    if (!partial_tree) {
      partial_tree = blproof.extractPartialTree(complete_tree, user);
      partial_trees[user] = partial_tree;
    }
    var serialized = JSON.parse(blproof.serializePartialTree(partial_tree));
    $('#partial_tree_for').html(serialize(serialized));
    $('#partial_tree_for_pretty').html(partial_tree.prettyPrintStr(format));
    //@hack
    twice(function () {
      $('#partial_tree').html(serialize(serialized));
    });
  });
});

// Verify
$(function () {
  $('#btn_verify').on('click', function (e) {
    e.preventDefault();
    $('#verify .flash').hide();

    var res;
    var html = '';

    try {
      var partial_tree = blproof.deserializePartialTree($('#partial_tree').val());
      var expected_root = blproof.deserializeRoot($('#expected_root').val());

      res = blproof.verifyTree(partial_tree, expected_root);
    }
    catch (err) {
      html += '<h4>Verification failed!</h4>';
      html += err.message;

      $('#verification').removeClass('alert-success').addClass('alert-danger').html(html);
      $('#verify_results').show();
      return;
    }

    html += '<h4>Verification successful!</h4>';
    html += 'User: ' + res.user;
    html += '<br>';
    html += 'Balance: ' + res.sum;

    $('#verification').removeClass('alert-danger').addClass('alert-success').html(html);
    $('#verify_results').show();
  });
});

// Prettify
$(function () {
  $('#btn_prettify').on('click', function (e) {
    e.preventDefault();
    $('#prettify .flash').hide();

    var ugly_json = $('#ugly_json').val();

    var partial_tree, pretty_json;

    try {
      pretty_json = JSON.stringify(JSON.parse(ugly_json), null, 2);
      $('#pretty_json').html(pretty_json);
    }
    catch (err) {
      $('#pretty_json').html('');
      error(err, 'prettify');
    }

    try {
      partial_tree = blproof.deserializePartialTree($('#ugly_json').val());
      $('#pretty_tree').html(partial_tree.prettyPrintStr(format));
      $('#pretty_tree').show();
    }
    catch (err) {
      $('#pretty_tree').hide();
    }
  });
});

$(function () {
  $.get('accounts.json', function (data) {
    $('#accounts').html(data);

    $('#btn_generate').trigger('click');
  }, 'text');
});

