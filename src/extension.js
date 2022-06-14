const main = () => {
  const log = (message) => {
    // customize logging
    console.info('CRB: ' + message);
  };

  const amountToNumber = (text) => {
    // parse about string to value
    // remove dollar sign
    // recognize negative value
    return parseFloat(text.replace('\u2212', '-').replace(/[$,]+/g, ''));
  };

  // which versions of the activity table are considered
  const SUPPORTED_VIEWS = ['Activity since last statement', 'All transactions', 'Year to date'];

  // get activity table
  const getActivityTable = () => {
    return document.querySelector('#activityTablesingleOVDAccountActivity');
  };

  log('Enter main()');

  // init cycle count
  let runs = 0;

  // cycle for reasonable loading time
  const intervalId = setInterval(() => {
    // increment cycle count
    runs++;

    // Give up if activity table has not loaded in 10 seconds.
    if (runs > 100) {
      log('Clear interval too many cycles');
      clearInterval(intervalId);
      return;
    }

    // check if more transactions can be loaded
    const loadMoreTransactionsOrRenderBalance = () => {
      const seeMore = document.querySelector('#seeMore');
      if (seeMore !== null) {
        // keep loading those table rows
        seeMore.click();
      } else {
        displayRunningBalance();
      }
    };

    // Configure MutationObserver and try to display running balance.
    const table = getActivityTable();
    if (table === null) {
      // try again later
      return;
    } else if (table.rows.length > 0) {
      // render running balance
      loadMoreTransactionsOrRenderBalance();

      // setup to render running balance on change
      log('Configure MutationObserver');
      let observer = new MutationObserver(loadMoreTransactionsOrRenderBalance);
      observer.observe(table, {
        attributes: true,
        subtree: true,
      });
    } else {
      // try again later
      return;
    }

    log('Clear interval');
    clearInterval(intervalId);
  }, 100);

  const displayRunningBalance = () => {
    log('Enter displayRunningBalance()');

    // Remove Balance column if it already exists.
    const runningBalExt = document.querySelectorAll('.running-balance-ext');
    Array.prototype.forEach.call(runningBalExt, (node) => {
      node.parentNode.removeChild(node);
    });

    // Find the account activity table (exclude pending transactions)
    const activityTable = getActivityTable();

    // Get transaction history.
    const transactions = activityTable.rows;

    // Return early while waiting for transaction history to load.
    if (transactions.length == 0) {
      log('No transactions');
      return;
    }

    // Return early if an unsupported view is active.
    let currentViewName = document.querySelector('#header-transactionTypeOptions .header-text');
    if (currentViewName !== null) {
      currentViewName = currentViewName.innerHTML;
    }
    if (!SUPPORTED_VIEWS.includes(currentViewName)) {
      log('Unsupported view');
      return;
    }

    // Add Balance column.
    let balanceColumn = document.createElement('th');
    balanceColumn.classList.add('amount', 'running-balance-ext');

    let balanceSpan = document.createElement('span');
    balanceSpan.className = 'TABLEHEADER';
    balanceSpan.innerHTML = 'Balance';
    balanceColumn.appendChild(balanceSpan);

    activityHeaders = activityTable.querySelector('.column-headers');
    activityHeaders.insertBefore(balanceColumn, activityHeaders.querySelector('.amount').nextSibling);

    // Find current balance and use it as running balance.
    const currentValue = document.querySelector('.current-balance-value').innerHTML;
    let runningBalance = amountToNumber(currentValue);

    if (isNaN(runningBalance)) {
      log('Unable to determine current balance');
      // continue, results in NaN values
    }

    log('Calculate and display running balance');

    // Calculate and display running balance for each transaction.
    for (const element of transactions) {
      // skip column headers (first row included)
      if (element.classList.contains('column-headers')) {
        continue;
      }
      // Clone an Amount cell to easily create a similar-looking Balance cell.
      let balanceCell = element.querySelector('.amount');
      if (balanceCell !== null) {
        balanceCell = balanceCell.cloneNode();
      } else {
        // no amount element
        continue;
      }
      // add classes and running balance as text
      balanceCell.classList.add('amount', 'running-balance-ext');
      balanceCell.innerHTML = '$' + runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 });
      // insert running balance element
      element.insertBefore(balanceCell, element.querySelector('.amount').nextSibling);

      // update runningBalence for next loop (will pull first element with class .amount)
      amountSpan = element.querySelector('.amount');
      const transactionAmount = amountToNumber(amountSpan.querySelector('.column-info').innerHTML);
      runningBalance -= transactionAmount;
    }
  };
};

main();
